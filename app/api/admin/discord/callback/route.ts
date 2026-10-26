import { timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isAdminConfigured, setAdminSessionCookie } from "@/lib/adminAuth";
import {
  authenticateDiscordAdmin,
  discordStateCookieName,
  getDiscordRedirectUri,
} from "@/lib/discordAuth";
import { checkRateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";

function statesMatch(provided: string | null, expected?: string) {
  if (!provided || !expected) {
    return false;
  }

  const a = Buffer.from(provided);
  const b = Buffer.from(expected);

  return a.byteLength === b.byteLength && timingSafeEqual(a, b);
}

function redirectToAdmin(request: Request, params: Record<string, string> = {}) {
  const url = new URL("/admin", request.url);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = NextResponse.redirect(url);
  response.cookies.delete({ name: discordStateCookieName, path: "/api/admin/discord" });

  return response;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieStore = await cookies();
  const expectedState = cookieStore.get(discordStateCookieName)?.value;

  if (!isAdminConfigured()) {
    return redirectToAdmin(request, { error: "not_configured" });
  }

  const rateLimit = checkRateLimit(request, {
    scope: "admin-login",
    limit: 10,
    windowMs: 15 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return redirectToAdmin(request, { error: "rate_limited" });
  }

  // Discord sends ?error=access_denied when the user clicks Cancel.
  if (url.searchParams.get("error")) {
    return redirectToAdmin(request, { error: "cancelled" });
  }

  if (!code || !statesMatch(state, expectedState)) {
    return redirectToAdmin(request, { error: "invalid_state" });
  }

  try {
    const result = await authenticateDiscordAdmin(
      code,
      getDiscordRedirectUri(request),
    );

    if (!result.allowed) {
      console.warn(
        `Denied admin login for Discord user ${result.user.username} (${result.user.id}): ${result.reason}.`,
      );

      return redirectToAdmin(request, {
        error: "code" in result && result.code ? result.code : "not_allowed",
        discord_id: result.user.id,
      });
    }

    const response = redirectToAdmin(request);
    setAdminSessionCookie(response);

    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Discord login failed.";

    console.error("Discord admin login failed:", message);

    return redirectToAdmin(request, { error: "discord_failed" });
  }
}
