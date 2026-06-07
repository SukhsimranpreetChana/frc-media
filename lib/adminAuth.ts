import { createHmac, randomUUID, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const adminCookieName = "fmc_admin_session";
const sessionMaxAgeSeconds = 60 * 60 * 8;

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

export function createAdminSessionResponse() {
  const sessionId = randomUUID();
  const response = NextResponse.json({ ok: true });

  response.cookies.set(adminCookieName, `${sessionId}.${signSession(sessionId)}`, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: sessionMaxAgeSeconds,
    path: "/",
  });

  return response;
}

export function clearAdminSessionResponse() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(adminCookieName);

  return response;
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
