import { createHmac, randomUUID, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const adminCookieName = "fmc_admin_session";
const readOnlyCookieName = "fmc_admin_readonly_session";
const sessionMaxAgeSeconds = 60 * 60 * 8;
const readOnlyPassword = "FMC";

function getAdminPassword() {
  return process.env.FMC_ADMIN_PASSWORD;
}

function getSessionSecret() {
  return process.env.ADMIN_SESSION_SECRET || getAdminPassword();
}

function signSession(sessionId: string) {
  const secret = getSessionSecret();

  if (!secret) {
    throw new Error("Missing FMC_ADMIN_PASSWORD.");
  }

  return createHmac("sha256", secret).update(sessionId).digest("base64url");
}

function verifySignedValue(value?: string) {
  if (!value) {
    return false;
  }

  const [sessionId, signature] = value.split(".");

  if (!sessionId || !signature) {
    return false;
  }

  let expectedSignature: string;

  try {
    expectedSignature = signSession(sessionId);
  } catch {
    return false;
  }

  const provided = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);

  return (
    provided.byteLength === expected.byteLength &&
    timingSafeEqual(provided, expected)
  );
}

function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");

  if (!origin) {
    return true;
  }

  return origin === new URL(request.url).origin;
}

export function requireSameOrigin(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  return null;
}

export function isAdminConfigured() {
  return Boolean(getAdminPassword());
}

export async function hasAdminSession() {
  const cookieStore = await cookies();

  return verifySignedValue(cookieStore.get(adminCookieName)?.value);
}

export async function hasReadOnlyAdminSession() {
  const cookieStore = await cookies();

  return verifySignedValue(cookieStore.get(readOnlyCookieName)?.value);
}

export async function hasAdminOrReadOnlySession() {
  return (await hasAdminSession()) || (await hasReadOnlyAdminSession());
}

export async function requireAdmin(request: Request) {
  const forbidden = requireSameOrigin(request);

  if (forbidden) {
    return forbidden;
  }

  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  return null;
}

export async function requireAdminOrReadOnly(request: Request) {
  const forbidden = requireSameOrigin(request);

  if (forbidden) {
    return forbidden;
  }

  if (!(await hasAdminOrReadOnlySession())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  return null;
}

function setSignedSessionCookie(response: NextResponse, cookieName: string) {
  const sessionId = randomUUID();

  response.cookies.set(cookieName, `${sessionId}.${signSession(sessionId)}`, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: sessionMaxAgeSeconds,
    path: "/",
  });
}

export function createAdminSessionResponse() {
  const response = NextResponse.json({ ok: true, role: "admin" });

  setSignedSessionCookie(response, adminCookieName);
  response.cookies.delete(readOnlyCookieName);

  return response;
}

export function createReadOnlyAdminSessionResponse() {
  const response = NextResponse.json({ ok: true, role: "readonly" });

  setSignedSessionCookie(response, readOnlyCookieName);
  response.cookies.delete(adminCookieName);

  return response;
}

export function clearAdminSessionResponse() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(adminCookieName);
  response.cookies.delete(readOnlyCookieName);

  return response;
}

export function isReadOnlyAdminPassword(password: string) {
  return password === readOnlyPassword;
}

export async function verifyAdminPassword(password: string) {
  const adminPassword = getAdminPassword();

  if (!adminPassword) {
    return false;
  }

  const provided = Buffer.from(password);
  const expected = Buffer.from(adminPassword);

  return (
    provided.byteLength === expected.byteLength &&
    timingSafeEqual(provided, expected)
  );
}
