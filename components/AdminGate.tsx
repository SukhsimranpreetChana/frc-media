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
      <div className="mt-8 rounded-lg border border-[#72007E]/20 bg-white p-6">
        <h2 className="text-lg text-[#17001C]">Admin unlocked</h2>
        <p className="mt-3 text-sm leading-6 text-[#17001C]/75">
          Admin tools are not connected yet. This area can later manage teams,
          Icedrive links, commissions, and uploaded media.
        </p>
      </div>
    );
  }

  return (
    <form
      className="mt-8 max-w-md rounded-lg border border-[#72007E]/20 bg-white p-6"
      onSubmit={handleSubmit}
    >
      <label className="block text-sm text-[#17001C]/75">
        Password
        <input
          className="mt-2 h-11 w-full rounded-md border border-[#72007E]/30 px-4 text-sm text-[#17001C] outline-none ring-[#A335E6]/20 focus:border-[#7137E3] focus:ring-4"
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          value={password}
        />
      </label>
      {error ? <p className="mt-3 text-sm text-[#F85259]">{error}</p> : null}
      <button
        className="font-primary mt-5 h-10 rounded-md bg-[#F85259] px-4 text-sm text-white hover:bg-[#A335E6]"
        type="submit"
      >
        Unlock admin
      </button>
    </form>
  );
}
