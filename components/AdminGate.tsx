"use client";

import { FormEvent, useState } from "react";

const adminPassword = "fmc2026";

export default function AdminGate() {
  const [password, setPassword] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password === adminPassword) {
      setIsUnlocked(true);
      setError("");
      return;
    }

    setError("Incorrect password.");
  }

  if (isUnlocked) {
    return (
      <div className="mt-8 rounded-lg border border-zinc-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-zinc-950">Admin unlocked</h2>
        <p className="mt-3 text-sm leading-6 text-zinc-600">
          Admin tools are not connected yet. This area can later manage teams,
          Icedrive links, commissions, and uploaded media.
        </p>
      </div>
    );
  }

  return (
    <form
      className="mt-8 max-w-md rounded-lg border border-zinc-200 bg-white p-6"
      onSubmit={handleSubmit}
    >
      <label className="block text-sm font-medium text-zinc-700">
        Password
        <input
          className="mt-2 h-11 w-full rounded-md border border-zinc-300 px-4 text-sm text-zinc-950 outline-none ring-red-700/20 focus:border-red-700 focus:ring-4"
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          value={password}
        />
      </label>
      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
      <button
        className="mt-5 h-10 rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white hover:bg-zinc-800"
        type="submit"
      >
        Unlock admin
      </button>
    </form>
  );
}
