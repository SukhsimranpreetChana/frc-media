import { NextResponse } from "next/server";
import { isAdminConfigured } from "@/lib/adminAuth";
import {
  createDiscordOAuthState,
  discordStateCookieName,
  getDiscordAuthorizeUrl,
  getDiscordRedirectUri,
} from "@/lib/discordAuth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!isAdminConfigured()) {
    return NextResponse.redirect(
      new URL("/admin?error=not_configured", request.url),
    );
  }

  const state = createDiscordOAuthState();
  const response = NextResponse.redirect(
    getDiscordAuthorizeUrl(state, getDiscordRedirectUri(request)),
  );

  // Lax so the cookie comes back on Discord's top-level redirect to the callback.
  response.cookies.set(discordStateCookieName, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 10,
    path: "/api/admin/discord",
  });

  return response;
}
