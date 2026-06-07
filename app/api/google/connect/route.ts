import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getGoogleOAuthAuthorizeUrl } from "@/lib/googleDrive";
import { saveGoogleOAuthState } from "@/lib/googleOAuthState";

export const runtime = "nodejs";

export async function GET() {
  const state = randomUUID();
  await saveGoogleOAuthState(state);
  const response = NextResponse.redirect(getGoogleOAuthAuthorizeUrl(state));

  response.cookies.set("fmc_google_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 10,
    path: "/",
  });

  return response;
}
