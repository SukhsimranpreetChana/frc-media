import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { getGoogleOAuthAuthorizeUrl } from "@/lib/googleDrive";
import { saveGoogleOAuthState } from "@/lib/googleOAuthState";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const unauthorized = await requireAdmin(request);

  if (unauthorized) {
    return unauthorized;
  }

  try {
    const state = randomUUID();

    await saveGoogleOAuthState(state).catch((error) => {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to save Google OAuth state.";

      console.error("Unable to save Google OAuth state:", message);
    });

    const response = NextResponse.redirect(getGoogleOAuthAuthorizeUrl(state));

    response.cookies.set("fmc_google_oauth_state", state, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 10,
      path: "/",
    });

    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to connect Google Drive.";

    console.error("Unable to connect Google Drive:", message);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
