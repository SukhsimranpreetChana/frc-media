"use client";

import { useEffect, useState } from "react";
import ClipAdmin from "@/components/ClipAdmin";
import CommissionsAdmin from "@/components/CommissionsAdmin";
import FooterHandlesAdmin from "@/components/FooterHandlesAdmin";

type AdminMode = "locked" | "admin";

const loginErrors: Record<string, string> = {
  not_configured: "Discord login is not configured on the server yet.",
  rate_limited: "Too many login attempts. Please try again later.",
  cancelled: "Discord login was cancelled.",
  invalid_state: "That login link expired. Please try again.",
  not_allowed: "This Discord account is not an FMC admin.",
  discord_failed: "Could not reach Discord. Please try again.",
};

function readLoginError() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("error");

  if (!code) {
    return "";
  }

  // Drop the error from the URL so a refresh does not show it again.
  window.history.replaceState(null, "", window.location.pathname);

  const discordId = params.get("discord_id");
  const message = loginErrors[code] || "Discord login failed.";

  return discordId && code === "not_allowed"
    ? `${message} Send an existing admin your Discord ID (${discordId}) to be added.`
    : message;
}

export default function AdminGate() {
  const [adminMode, setAdminMode] = useState<AdminMode>("locked");
  const [isConfigured, setIsConfigured] = useState(true);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Check whether this browser already has a valid admin session.
    async function loadSession() {
      const loginError = readLoginError();

      try {
        const response = await fetch("/api/admin/session");
        const data = (await response.json()) as {
          authenticated?: boolean;
          configured?: boolean;
        };

        setAdminMode(data.authenticated ? "admin" : "locked");
        setIsConfigured(data.configured !== false);
        setError(loginError);
      } catch {
        setError("Could not check admin session.");
      } finally {
        setIsCheckingSession(false);
      }
    }

    void loadSession();
  }, []);

  async function handleLogout() {
    // Clear the session on the server, then lock the dashboard locally.
    await fetch("/api/admin/session", { method: "DELETE" });
    setAdminMode("locked");
  }

  if (isCheckingSession) {
    return (
      <div className="scrap-card mt-8 max-w-md p-6 text-sm text-[#17001C]/75">
        Checking admin session...
      </div>
    );
  }

  if (adminMode !== "locked") {
    return (
      <>
        {/* Once unlocked, show all admin tools behind the same gate. */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <div />
          <button
            className="font-primary fmc-button h-10 bg-[#17001C] px-4 text-sm text-white hover:bg-[#72007E]"
            onClick={() => void handleLogout()}
            type="button"
          >
            Log out
          </button>
        </div>
        <ClipAdmin />
        <CommissionsAdmin />
        <FooterHandlesAdmin />
      </>
    );
  }

  return (
    <div className="scrap-card mt-8 max-w-md p-6">
      {!isConfigured ? (
        <p className="mb-4 text-sm text-[#F85259]">
          Admin login is not configured. Add ADMIN_SESSION_SECRET,
          DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, and an admin allowlist on
          the server to enable this dashboard.
        </p>
      ) : null}
      <p className="text-sm text-[#17001C]/75">
        Sign in with the Discord account that has FMC admin access.
      </p>
      {error ? <p className="mt-3 text-sm text-[#F85259]">{error}</p> : null}
      {isConfigured ? (
        // A plain link, not fetch: the login route redirects the whole page to Discord.
        <a
          className="font-primary fmc-button mt-5 inline-flex h-10 items-center justify-center bg-[#5865F2] px-4 text-sm text-white hover:bg-[#A335E6]"
          href="/api/admin/discord/login"
        >
          Log in with Discord
        </a>
      ) : null}
    </div>
  );
}
