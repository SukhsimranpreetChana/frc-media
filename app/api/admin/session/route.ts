import { NextResponse } from "next/server";
import {
  clearAdminSessionResponse,
  hasAdminSession,
  isAdminConfigured,
  requireSameOrigin,
} from "@/lib/adminAuth";

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

export async function DELETE(request: Request) {
  const forbidden = requireSameOrigin(request);

  if (forbidden) {
    return forbidden;
  }

  return clearAdminSessionResponse();
}
