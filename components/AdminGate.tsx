"use client";

import { FormEvent, useState } from "react";
import CommissionsAdmin from "@/components/CommissionsAdmin";
import FooterHandlesAdmin from "@/components/FooterHandlesAdmin";

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
      <>
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
        type="submit"
      >
        Unlock admin
      </button>
    </form>
  );
}
