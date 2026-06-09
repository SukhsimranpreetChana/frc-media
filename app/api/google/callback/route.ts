import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { exchangeGoogleOAuthCode } from "@/lib/googleDrive";
import { consumeGoogleOAuthState } from "@/lib/googleOAuthState";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const cookieStore = await cookies();
  const expectedState = cookieStore.get("fmc_google_oauth_state")?.value;
  const hasCookieState = Boolean(expectedState && state === expectedState);
  const hasStoredState = state ? await consumeGoogleOAuthState(state) : false;

  if (error) {
    return new NextResponse(`Google OAuth failed: ${error}`, { status: 400 });
  }

  if (!code || !state || (!hasCookieState && !hasStoredState)) {
    return new NextResponse(
      [
        "Invalid Google OAuth callback.",
        "",
        "Most likely causes:",
        "- You opened /api/google/callback directly instead of starting at /api/google/connect.",
        "- GOOGLE_OAUTH_REDIRECT_URI does not exactly match this deployed site URL.",
        "- Google OAuth redirected to a different domain than the one that started /api/google/connect, so the state cookie was not sent back.",
      ].join("\n"),
      {
        status: 400,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
        },
      },
    );
  }

  try {
    const result = await exchangeGoogleOAuthCode(code);
    const tokenStorageMessage = result.tokenStorage?.persisted
      ? "The refresh token was saved locally."
      : "Production note: this host is read-only, so set GOOGLE_REFRESH_TOKEN in your deployment environment for persistent uploads.";
    const response = new NextResponse(
      [
        "Google Drive is connected for FMC uploads.",
        tokenStorageMessage,
        "",
        "You can close this tab and try an upload again.",
      ].join("\n"),
      {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
        },
      },
    );

    response.cookies.delete("fmc_google_oauth_state");
    return response;
  } catch (exchangeError) {
    const message =
      exchangeError instanceof Error
        ? exchangeError.message
        : "Unable to connect Google Drive.";

    return new NextResponse(message, { status: 500 });
  }
}
