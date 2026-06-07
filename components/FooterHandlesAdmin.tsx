"use client";

import { FormEvent, useEffect, useState } from "react";
import { downloadCsv, toCsv } from "@/lib/csvExport";
import type { FooterHandle } from "@/types";

export default function FooterHandlesAdmin() {
  const [handles, setHandles] = useState<FooterHandle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeHandleId, setActiveHandleId] = useState("");
  const [message, setMessage] = useState("");
  const [handle, setHandle] = useState("");
  const [link, setLink] = useState("");
  const [profileImageUrl, setProfileImageUrl] = useState("");

  async function fetchFooterHandles() {
    const response = await fetch("/api/footer-handles");
    const data = (await response.json().catch(() => null)) as {
      handles?: FooterHandle[];
      error?: string;
    } | null;

    if (!response.ok) {
      throw new Error(data?.error || "Could not load footer profiles.");
    }

    return data?.handles || [];
  }

  useEffect(() => {
    let isMounted = true;

    async function loadFooterHandles() {
      try {
        const nextHandles = await fetchFooterHandles();

        if (isMounted) {
          setHandles(nextHandles);
        }
      } catch {
        if (isMounted) {
          setMessage("Could not load footer profiles from Supabase.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadFooterHandles();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleAddFooterLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const trimmedHandle = handle.trim();
    const trimmedLink = link.trim();
    const trimmedProfileImageUrl = profileImageUrl.trim();

    if (!trimmedHandle || !trimmedLink) {
      return;
    }

    setActiveHandleId("new");

    try {
      const response = await fetch("/api/footer-handles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          handle: trimmedHandle,
          link: trimmedLink,
          profileImageUrl: trimmedProfileImageUrl,
        }),
      });
      const data = (await response.json().catch(() => null)) as {
        handle?: FooterHandle;
        error?: string;
      } | null;

      if (!response.ok || !data?.handle) {
        throw new Error(data?.error || "Could not add footer profile.");
      }

      setHandles((currentHandles) => [
        data.handle as FooterHandle,
        ...currentHandles,
      ]);
      setHandle("");
      setLink("");
      setProfileImageUrl("");
      setMessage("Footer profile added.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not add footer profile.",
      );
    } finally {
      setActiveHandleId("");
    }
  }

  async function handleRemoveFooterLink(id: string) {
    setActiveHandleId(id);
    setMessage("");

    try {
      const response = await fetch("/api/footer-handles", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });
      const data = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        throw new Error(data?.error || "Could not remove footer profile.");
      }

      setHandles((currentHandles) =>
        currentHandles.filter((item) => item.id !== id),
      );
      setMessage("Footer profile removed.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not remove footer profile.",
      );
    } finally {
      setActiveHandleId("");
    }
  }

  function handleExportFooterHandles() {
    const csv = toCsv(handles, [
      { header: "id", value: (item) => item.id },
      { header: "handle", value: (item) => item.handle },
      { header: "link", value: (item) => item.link },
      {
        header: "profile_image_url",
        value: (item) => item.profileImageUrl,
      },
    ]);

    downloadCsv("fmc-footer-handles.csv", csv);
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
          className="font-primary fmc-button mt-5 h-10 bg-[#F85259] px-4 text-sm text-white hover:bg-[#A335E6] disabled:opacity-60"
          disabled={activeHandleId === "new"}
          type="submit"
        >
          {activeHandleId === "new" ? "Adding..." : "Add profile"}
        </button>
        {message ? (
          <p className="mt-3 text-sm text-[#17001C]/70">{message}</p>
        ) : null}
      </form>

      <div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg text-[#17001C]">Footer profiles</h2>
          <button
            className="font-primary fmc-button h-10 bg-[#17001C] px-4 text-sm text-white hover:bg-[#72007E] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={handles.length === 0}
            onClick={handleExportFooterHandles}
            type="button"
          >
            Export CSV
          </button>
        </div>
        {isLoading ? (
          <p className="scrap-card mt-5 p-5 text-sm text-[#17001C]/75">
            Loading footer profiles...
          </p>
        ) : null}
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
                className="font-primary fmc-button bg-[#17001C] px-3 py-2 text-xs text-white hover:bg-[#72007E] disabled:opacity-60"
                disabled={activeHandleId === item.id}
                onClick={() => void handleRemoveFooterLink(item.id)}
                type="button"
              >
                {activeHandleId === item.id ? "Removing..." : "Remove"}
              </button>
            </div>
          ))}
        </div>
        {!isLoading && handles.length === 0 ? (
          <p className="scrap-card mt-5 p-5 text-sm text-[#17001C]/75">
            No footer profiles added yet.
          </p>
        ) : null}
      </div>
    </div>
  );
}
