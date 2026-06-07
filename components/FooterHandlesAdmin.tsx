"use client";

import { FormEvent, useState, useSyncExternalStore } from "react";
import {
  defaultFooterHandles,
  readStoredFooterHandles,
  subscribeToFooterHandles,
  writeStoredFooterHandles,
} from "@/lib/footerHandles";
import type { FooterHandle } from "@/types";

export default function FooterHandlesAdmin() {
  const handles = useSyncExternalStore(
    subscribeToFooterHandles,
    readStoredFooterHandles,
    () => defaultFooterHandles,
  );
  const [handle, setHandle] = useState("");
  const [link, setLink] = useState("");
  const [profileImageUrl, setProfileImageUrl] = useState("");

  function saveHandles(nextHandles: FooterHandle[]) {
    writeStoredFooterHandles(nextHandles);
  }

  function handleAddFooterLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedHandle = handle.trim();
    const trimmedLink = link.trim();
    const trimmedProfileImageUrl = profileImageUrl.trim();

    if (!trimmedHandle || !trimmedLink) {
      return;
    }

    saveHandles([
      {
        id: crypto.randomUUID(),
        handle: trimmedHandle,
        link: trimmedLink,
        profileImageUrl: trimmedProfileImageUrl || undefined,
      },
      ...handles,
    ]);
    setHandle("");
    setLink("");
    setProfileImageUrl("");
  }

  function handleRemoveFooterLink(id: string) {
    saveHandles(handles.filter((item) => item.id !== id));
  }

  return (
    <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(280px,420px)_1fr]">
      <form className="scrap-card p-6" onSubmit={handleAddFooterLink}>
        <h2 className="text-lg text-[#17001C]">Footer TikTok profiles</h2>
        <div className="mt-5 grid gap-4">
          <label className="block text-sm text-[#17001C]/75">
            Handle
            <input
              className="mt-2 h-11 w-full rounded-md border-2 border-[#17001C] bg-[#F4E7E7] px-4 text-sm text-[#17001C] outline-none ring-[#A335E6]/20 focus:border-[#7137E3] focus:ring-4"
              onChange={(event) => setHandle(event.target.value)}
              placeholder="@firstmedia"
              value={handle}
            />
          </label>
          <label className="block text-sm text-[#17001C]/75">
            TikTok link
            <input
              className="mt-2 h-11 w-full rounded-md border-2 border-[#17001C] bg-[#F4E7E7] px-4 text-sm text-[#17001C] outline-none ring-[#A335E6]/20 focus:border-[#7137E3] focus:ring-4"
              onChange={(event) => setLink(event.target.value)}
              type="url"
              value={link}
            />
          </label>
          <label className="block text-sm text-[#17001C]/75">
            Profile picture URL
            <input
              className="mt-2 h-11 w-full rounded-md border-2 border-[#17001C] bg-[#F4E7E7] px-4 text-sm text-[#17001C] outline-none ring-[#A335E6]/20 focus:border-[#7137E3] focus:ring-4"
              onChange={(event) => setProfileImageUrl(event.target.value)}
              placeholder="https://..."
              type="url"
              value={profileImageUrl}
            />
          </label>
        </div>
        <button
          className="font-primary fmc-button mt-5 h-10 bg-[#F85259] px-4 text-sm text-white hover:bg-[#A335E6]"
          type="submit"
        >
          Add profile
        </button>
      </form>

      <div>
        <h2 className="text-lg text-[#17001C]">Footer profiles</h2>
        <div className="mt-5 grid gap-3">
          {handles.map((item) => (
            <div
              className="fmc-dark-halftone flex flex-col gap-3 rounded-2xl border-2 border-[#F85259]/40 px-4 py-3 text-white sm:flex-row sm:items-center sm:justify-between"
              key={item.id}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border-2 border-[#F85259] bg-[#F4E7E7] text-sm text-[#17001C]">
                  {item.profileImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      alt=""
                      className="h-full w-full object-cover"
                      src={item.profileImageUrl}
                    />
                  ) : (
                    <span className="font-primary uppercase">
                      {item.handle.replace("@", "").slice(0, 1) || "?"}
                    </span>
                  )}
                </div>
                <a
                  className="text-sm underline decoration-[#F85259] decoration-2 underline-offset-4"
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {item.handle}
                </a>
              </div>
              <button
                className="font-primary fmc-button bg-[#17001C] px-3 py-2 text-xs text-white hover:bg-[#72007E]"
                onClick={() => handleRemoveFooterLink(item.id)}
                type="button"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        {handles.length === 0 ? (
          <p className="scrap-card mt-5 p-5 text-sm text-[#17001C]/75">
            No footer profiles added yet.
          </p>
        ) : null}
      </div>
    </div>
  );
}
