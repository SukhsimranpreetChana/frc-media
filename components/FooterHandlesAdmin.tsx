"use client";

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
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
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreviewUrl, setProfileImagePreviewUrl] = useState("");
  const [editingHandleId, setEditingHandleId] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (!profileImageFile) {
      setProfileImagePreviewUrl("");
      return;
    }

    const previewUrl = URL.createObjectURL(profileImageFile);
    setProfileImagePreviewUrl(previewUrl);

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [profileImageFile]);

  function resetFooterForm() {
    setHandle("");
    setLink("");
    setProfileImageUrl("");
    setProfileImageFile(null);
    setEditingHandleId("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function startEditingFooterHandle(item: FooterHandle) {
    setHandle(item.handle);
    setLink(item.link);
    setProfileImageUrl(item.profileImageUrl || "");
    setProfileImageFile(null);
    setEditingHandleId(item.id);
    setMessage("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleProfileImageChange(event: ChangeEvent<HTMLInputElement>) {
    setProfileImageFile(event.target.files?.[0] || null);
  }

  async function handleSaveFooterLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const trimmedHandle = handle.trim();
    const trimmedLink = link.trim();

    if (!trimmedHandle || !trimmedLink) {
      return;
    }

    if (!profileImageFile && !profileImageUrl) {
      setMessage("Please upload a profile picture.");
      return;
    }

    setActiveHandleId(editingHandleId || "new");

    try {
      const formData = new FormData();
      formData.set("handle", trimmedHandle);
      formData.set("link", trimmedLink);

      if (editingHandleId) {
        formData.set("id", editingHandleId);
        formData.set("existingProfileImageUrl", profileImageUrl);
      }

      if (profileImageFile) {
        formData.set("profileImage", profileImageFile);
      }

      const response = await fetch("/api/footer-handles", {
        method: editingHandleId ? "PATCH" : "POST",
        body: formData,
      });
      const data = (await response.json().catch(() => null)) as {
        handle?: FooterHandle;
        error?: string;
      } | null;

      if (!response.ok || !data?.handle) {
        throw new Error(
          data?.error ||
            (editingHandleId
              ? "Could not update footer profile."
              : "Could not add footer profile."),
        );
      }

      if (editingHandleId) {
        setHandles((currentHandles) =>
          currentHandles.map((item) =>
            item.id === editingHandleId ? (data.handle as FooterHandle) : item,
          ),
        );
        setMessage("Footer profile updated.");
      } else {
        setHandles((currentHandles) => [
          data.handle as FooterHandle,
          ...currentHandles,
        ]);
        setMessage("Footer profile added.");
      }
      resetFooterForm();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : editingHandleId
            ? "Could not update footer profile."
            : "Could not add footer profile.",
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
      <form className="scrap-card p-6" onSubmit={handleSaveFooterLink}>
        <h2 className="text-lg text-[#17001C]">
          {editingHandleId ? "Edit footer profile" : "Footer TikTok profiles"}
        </h2>
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
            Profile picture
            <input
              accept="image/*"
              className="mt-2 w-full rounded-md border-2 border-[#17001C] bg-[#F4E7E7] px-4 py-3 text-sm text-[#17001C] file:mr-4 file:rounded-md file:border-0 file:bg-[#17001C] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white outline-none ring-[#A335E6]/20 focus:border-[#7137E3] focus:ring-4"
              onChange={handleProfileImageChange}
              ref={fileInputRef}
              required={!editingHandleId && !profileImageUrl}
              type="file"
            />
            {editingHandleId && profileImageUrl && !profileImageFile ? (
              <span className="mt-2 block text-xs text-[#17001C]/55">
                Leave this empty to keep the current profile picture.
              </span>
            ) : null}
          </label>
          {profileImageUrl || profileImageFile ? (
            <div className="flex items-center gap-3 rounded-md border-2 border-[#17001C]/15 bg-white/70 p-3">
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 border-[#F85259] bg-[#F4E7E7] text-sm text-[#17001C]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt=""
                  className="h-full w-full object-cover"
                  src={profileImagePreviewUrl || profileImageUrl}
                />
              </div>
              <p className="text-xs text-[#17001C]/60">
                {profileImageFile
                  ? profileImageFile.name
                  : "Current profile picture"}
              </p>
            </div>
          ) : null}
        </div>
        <button
          className="font-primary fmc-button mt-5 h-10 bg-[#F85259] px-4 text-sm text-white hover:bg-[#A335E6] disabled:opacity-60"
          disabled={activeHandleId === (editingHandleId || "new")}
          type="submit"
        >
          {activeHandleId === (editingHandleId || "new")
            ? "Saving..."
            : editingHandleId
              ? "Save profile"
              : "Add profile"}
        </button>
        {editingHandleId ? (
          <button
            className="ml-3 mt-5 h-10 px-4 text-sm font-semibold text-[#72007E] underline decoration-[#F85259] decoration-2 underline-offset-4"
            onClick={resetFooterForm}
            type="button"
          >
            Cancel
          </button>
        ) : null}
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
              <div className="flex gap-2">
                <button
                  className="font-primary fmc-button bg-[#7137E3] px-3 py-2 text-xs text-white hover:bg-[#A335E6] disabled:opacity-60"
                  disabled={activeHandleId === item.id}
                  onClick={() => startEditingFooterHandle(item)}
                  type="button"
                >
                  Edit
                </button>
                <button
                  className="font-primary fmc-button bg-[#17001C] px-3 py-2 text-xs text-white hover:bg-[#72007E] disabled:opacity-60"
                  disabled={activeHandleId === item.id}
                  onClick={() => void handleRemoveFooterLink(item.id)}
                  type="button"
                >
                  {activeHandleId === item.id ? "Removing..." : "Remove"}
                </button>
              </div>
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
