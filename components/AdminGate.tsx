"use client";

import { FormEvent, useEffect, useState } from "react";
import ClipAdmin from "@/components/ClipAdmin";
import CommissionsAdmin from "@/components/CommissionsAdmin";
import CompetitionSubmissionsAdmin from "@/components/CompetitionSubmissionsAdmin";
import FooterHandlesAdmin from "@/components/FooterHandlesAdmin";

type AdminMode = "locked" | "admin";

export default function AdminGate() {
  const [password, setPassword] = useState("");
  const [adminMode, setAdminMode] = useState<AdminMode>("locked");
  const [isConfigured, setIsConfigured] = useState(true);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Check whether this browser already has a valid admin session.
    async function loadSession() {
      try {
        const response = await fetch("/api/admin/session");
        const data = (await response.json()) as {
          authenticated?: boolean;
          configured?: boolean;
        };

        setAdminMode(data.authenticated ? "admin" : "locked");
        setIsConfigured(data.configured !== false);
      } catch {
        setError("Could not check admin session.");
      } finally {
        setIsCheckingSession(false);
      }
    }

    void loadSession();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    try {
      // Send the password to the session route and let the server set the session.
      const response = await fetch("/api/admin/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;

        setError(data?.error || "Incorrect password.");
        return;
      }

      setAdminMode("admin");
      setPassword("");
    } catch {
      setError("Could not unlock admin.");
    }
  }

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
        <CompetitionSubmissionsAdmin />
        <CommissionsAdmin />
        <FooterHandlesAdmin />
      </>
    );
  }

  return (
    <form
      className="scrap-card mt-8 max-w-md p-6"
      onSubmit={handleSubmit}
    >
      {!isConfigured ? (
        <p className="mb-4 text-sm text-[#F85259]">
          Admin authentication is not configured. Add FMC_ADMIN_PASSWORD and a
          separate ADMIN_SESSION_SECRET on the server to enable this dashboard.
        </p>
      ) : null}
      <label className="block text-sm text-[#17001C]/75">
        Password
        <input
          className="mt-2 h-11 w-full rounded-md border-2 border-[#17001C] bg-[#F4E7E7] px-4 text-sm text-[#17001C] outline-none ring-[#A335E6]/20 focus:border-[#7137E3] focus:ring-4"
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          value={password}
        />
      </label>
      {error ? <p className="mt-3 text-sm text-[#F85259]">{error}</p> : null}
      <button
        className="font-primary fmc-button mt-5 h-10 bg-[#F85259] px-4 text-sm text-white hover:bg-[#A335E6]"
        disabled={!isConfigured}
        type="submit"
      >
        Unlock admin
      </button>
    </form>
  );
}
