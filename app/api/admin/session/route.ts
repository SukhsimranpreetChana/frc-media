import { NextResponse } from "next/server";
import {
  clearAdminSessionResponse,
  createAdminSessionResponse,
  hasAdminSession,
  isAdminConfigured,
  requireSameOrigin,
  verifyAdminPassword,
} from "@/lib/adminAuth";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    configured: isAdminConfigured(),
    authenticated: await hasAdminSession(),
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
