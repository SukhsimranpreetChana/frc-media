import { NextResponse } from "next/server";
import {
  clearAdminSessionResponse,
  createAdminSessionResponse,
  createReadOnlyAdminSessionResponse,
  hasAdminSession,
  hasReadOnlyAdminSession,
  isAdminConfigured,
  isReadOnlyAdminPassword,
  requireSameOrigin,
  verifyAdminPassword,
} from "@/lib/adminAuth";

export const runtime = "nodejs";

export async function GET() {
  const authenticated = await hasAdminSession();
  const readOnly = !authenticated && (await hasReadOnlyAdminSession());

  return NextResponse.json({
    configured: isAdminConfigured(),
    authenticated,
    readOnly,
    role: authenticated ? "admin" : readOnly ? "readonly" : "none",
  });
}

export async function POST(request: Request) {
  const forbidden = requireSameOrigin(request);

  if (forbidden) {
    return forbidden;
  }

  const payload = (await request.json().catch(() => null)) as {
    password?: string;
  } | null;
  const password = payload?.password || "";

  if (!isAdminConfigured()) {
    return NextResponse.json(
      { error: "Admin password is not configured." },
      { status: 503 },
    );
  }

  if (isReadOnlyAdminPassword(password)) {
    return createReadOnlyAdminSessionResponse();
  }

  if (!(await verifyAdminPassword(password))) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  return createAdminSessionResponse();
}

export async function DELETE(request: Request) {
  const forbidden = requireSameOrigin(request);

  if (forbidden) {
    return forbidden;
  }

  return clearAdminSessionResponse();
}
