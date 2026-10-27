import { NextResponse } from "next/server";
import {
  clearAdminSessionResponse,
  createAdminSessionResponse,
  hasAdminSession,
  isAdminConfigured,
  requireSameOrigin,
  verifyAdminPassword,
} from "@/lib/adminAuth";
import { checkRateLimit, resetRateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";

export async function GET() {
  const authenticated = await hasAdminSession();

  return NextResponse.json(
    {
      configured: isAdminConfigured(),
      authenticated,
      role: authenticated ? "admin" : "none",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  const forbidden = requireSameOrigin(request);

  if (forbidden) {
    return forbidden;
  }

  const rateLimit = checkRateLimit(request, {
    scope: "admin-login",
    limit: 5,
    windowMs: 15 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many login attempts. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      },
    );
  }

  const payload = (await request.json().catch(() => null)) as {
    password?: string;
  } | null;
  const password = payload?.password || "";

  if (!isAdminConfigured()) {
    return NextResponse.json(
      { error: "Admin authentication is not configured." },
      { status: 503 },
    );
  }

  if (!(await verifyAdminPassword(password))) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  resetRateLimit(request, "admin-login");
  return createAdminSessionResponse();
}

export async function DELETE(request: Request) {
  const forbidden = requireSameOrigin(request);

  if (forbidden) {
    return forbidden;
  }

  return clearAdminSessionResponse();
}
