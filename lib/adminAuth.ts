import { createHmac, randomUUID, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isDiscordAuthConfigured } from "@/lib/discordAuth";

const adminCookieName = "fmc_admin_session";
const readOnlyCookieName = "fmc_admin_readonly_session";
const sessionMaxAgeSeconds = 60 * 60 * 8;

function getSessionSecret() {
  return process.env.ADMIN_SESSION_SECRET;
}

function signSession(payload: string) {
  const secret = getSessionSecret();

  if (!secret) {
    throw new Error("Missing ADMIN_SESSION_SECRET.");
  }

  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function verifySignedValue(value?: string) {
  if (!value) {
    return false;
  }

  const [version, issuedAtValue, sessionId, signature, extra] = value.split(".");

  if (version !== "v1" || !issuedAtValue || !sessionId || !signature || extra) {
    return false;
  }

  const issuedAt = Number(issuedAtValue);
  const now = Math.floor(Date.now() / 1000);

  if (
    !Number.isSafeInteger(issuedAt) ||
    issuedAt > now + 60 ||
    now - issuedAt > sessionMaxAgeSeconds
  ) {
    return false;
  }

  let expectedSignature: string;

  try {
    expectedSignature = signSession(`${version}.${issuedAtValue}.${sessionId}`);
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
  return Boolean(getSessionSecret() && isDiscordAuthConfigured());
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

function setSignedSessionCookie(response: NextResponse, cookieName: string) {
  const sessionId = randomUUID();
  const issuedAt = Math.floor(Date.now() / 1000);
  const payload = `v1.${issuedAt}.${sessionId}`;

  response.cookies.set(cookieName, `${payload}.${signSession(payload)}`, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: sessionMaxAgeSeconds,
    path: "/",
    priority: "high",
  });
}

export function setAdminSessionCookie(response: NextResponse) {
  setSignedSessionCookie(response, adminCookieName);
  response.cookies.delete(readOnlyCookieName);
}

export function clearAdminSessionResponse() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(adminCookieName);
  response.cookies.delete(readOnlyCookieName);

  return response;
}
