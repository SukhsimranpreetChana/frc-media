"use client";

import { FormEvent, useState, useSyncExternalStore } from "react";
import CommissionCard from "@/components/CommissionCard";
import {
  defaultCommissions,
  readStoredCommissions,
  subscribeToCommissions,
  writeStoredCommissions,
} from "@/lib/commissions";
import type { Commission } from "@/types";

export default function CommissionsAdmin() {
  const commissions = useSyncExternalStore(
    subscribeToCommissions,
    readStoredCommissions,
    () => defaultCommissions,
  );
  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [costRange, setCostRange] = useState("");

  function saveCommissions(nextCommissions: Commission[]) {
    writeStoredCommissions(nextCommissions);
  }

  function handleAddCommission(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedTitle = title.trim();
    const trimmedLink = link.trim();
    const trimmedCostRange = costRange.trim();

    if (!trimmedTitle || !trimmedLink || !trimmedCostRange) {
      return;
    }

    const nextCommission: Commission = {
      id: crypto.randomUUID(),
      title: trimmedTitle,
      link: trimmedLink,
      costRange: trimmedCostRange,
    };

    saveCommissions([nextCommission, ...commissions]);
    setTitle("");
    setLink("");
    setCostRange("");
  }

  function handleRemoveCommission(id: string) {
    saveCommissions(commissions.filter((commission) => commission.id !== id));
  }

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(280px,420px)_1fr]">
      <form className="scrap-card p-6" onSubmit={handleAddCommission}>
        <h2 className="text-lg text-[#17001C]">Post a commission</h2>
        <div className="mt-5 grid gap-4">
          <label className="block text-sm text-[#17001C]/75">
            Title
            <input
              className="mt-2 h-11 w-full rounded-md border-2 border-[#17001C] bg-[#F4E7E7] px-4 text-sm text-[#17001C] outline-none ring-[#A335E6]/20 focus:border-[#7137E3] focus:ring-4"
              onChange={(event) => setTitle(event.target.value)}
              value={title}
            />
          </label>
          <label className="block text-sm text-[#17001C]/75">
            Link
            <input
              className="mt-2 h-11 w-full rounded-md border-2 border-[#17001C] bg-[#F4E7E7] px-4 text-sm text-[#17001C] outline-none ring-[#A335E6]/20 focus:border-[#7137E3] focus:ring-4"
              onChange={(event) => setLink(event.target.value)}
              type="url"
              value={link}
            />
          </label>
          <label className="block text-sm text-[#17001C]/75">
            Cost range
            <input
              className="mt-2 h-11 w-full rounded-md border-2 border-[#17001C] bg-[#F4E7E7] px-4 text-sm text-[#17001C] outline-none ring-[#A335E6]/20 focus:border-[#7137E3] focus:ring-4"
              onChange={(event) => setCostRange(event.target.value)}
              placeholder="$50-$150"
              value={costRange}
            />
          </label>
        </div>
        <button
          className="font-primary fmc-button mt-5 h-10 bg-[#F85259] px-4 text-sm text-white hover:bg-[#A335E6]"
          type="submit"
        >
          Add commission
        </button>
      </form>

      <div>
        <h2 className="text-lg text-[#17001C]">Posted commissions</h2>
        <div className="mt-5 grid gap-6 md:grid-cols-2">
          {commissions.map((commission) => (
            <div className="relative" key={commission.id}>
              <CommissionCard commission={commission} />
              <button
                className="font-primary fmc-button absolute right-4 top-4 bg-[#17001C] px-3 py-2 text-xs text-white hover:bg-[#72007E]"
                onClick={() => handleRemoveCommission(commission.id)}
                type="button"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        {commissions.length === 0 ? (
          <p className="scrap-card mt-5 p-5 text-sm text-[#17001C]/75">
            no commisions right no sorry :/
          </p>
        ) : null}
      </div>
    </div>
  );
}
