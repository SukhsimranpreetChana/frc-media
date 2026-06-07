"use client";

import { useEffect, useState } from "react";
import MediaClipCard from "@/components/MediaClipCard";
import {
  deleteMediaClip,
  getPendingMediaClips,
  updateMediaClipApproval,
} from "@/lib/supabase";
import type { MediaClip } from "@/types";

export default function ClipAdmin() {
  const [pendingClips, setPendingClips] = useState<MediaClip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeClipId, setActiveClipId] = useState("");
  const [message, setMessage] = useState("");

  async function loadPendingClips() {
    setIsLoading(true);
    setMessage("");

    try {
      setPendingClips(await getPendingMediaClips());
    } catch {
      setMessage("Could not load pending clips. Check Supabase policies.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadPendingClips();
  }, []);

  async function handleApprove(clipId: string) {
    setActiveClipId(clipId);
    setMessage("");

    try {
      await updateMediaClipApproval(clipId, true);
      setPendingClips((clips) => clips.filter((clip) => clip.id !== clipId));
      setMessage("Clip approved. It will now appear in public team searches.");
      window.dispatchEvent(new Event("fmc-media-uploaded"));
    } catch {
      setMessage("Could not approve clip. Check Supabase update policies.");
    } finally {
      setActiveClipId("");
    }
  }

  async function handleRemove(clipId: string) {
    setActiveClipId(clipId);
    setMessage("");

    try {
      await deleteMediaClip(clipId);
      setPendingClips((clips) => clips.filter((clip) => clip.id !== clipId));
      setMessage("Pending clip removed.");
    } catch {
      setMessage("Could not remove clip. Check Supabase delete policies.");
    } finally {
      setActiveClipId("");
    }
  }

  return (
    <section className="scrap-card mt-8 p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-lg text-[#17001C]">Review submitted clips</h2>
          <p className="mt-2 text-sm text-[#17001C]/70">
            Public uploads stay pending until an admin approves them.
          </p>
        </div>
        <button
          className="font-primary fmc-button h-10 bg-[#7137E3] px-4 text-sm text-white hover:bg-[#A335E6] disabled:opacity-60"
          disabled={isLoading}
          onClick={() => void loadPendingClips()}
          type="button"
        >
          Refresh
        </button>
      </div>

      {message ? <p className="mt-4 text-sm text-[#17001C]/75">{message}</p> : null}

      {isLoading ? (
        <div className="mt-6 rounded-lg border-2 border-dashed border-[#72007E] bg-[#F4E7E7] p-6 text-sm text-[#17001C]/70">
          Loading pending clips...
        </div>
      ) : null}

      {!isLoading && pendingClips.length === 0 ? (
        <div className="mt-6 rounded-lg border-2 border-dashed border-[#72007E] bg-[#F4E7E7] p-6 text-sm text-[#17001C]/70">
          No clips are waiting for review right now.
        </div>
      ) : null}

      {!isLoading && pendingClips.length > 0 ? (
        <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {pendingClips.map((clip) => (
            <div className="flex flex-col gap-4" key={clip.id}>
              <MediaClipCard clip={clip} />
              <div className="flex gap-3">
                <button
                  className="font-primary fmc-button h-10 flex-1 bg-[#F85259] px-4 text-sm text-white hover:bg-[#A335E6] disabled:opacity-60"
                  disabled={activeClipId === clip.id}
                  onClick={() => void handleApprove(clip.id)}
                  type="button"
                >
                  Approve
                </button>
                <button
                  className="font-primary fmc-button h-10 flex-1 bg-[#17001C] px-4 text-sm text-white hover:bg-[#72007E] disabled:opacity-60"
                  disabled={activeClipId === clip.id}
                  onClick={() => void handleRemove(clip.id)}
                  type="button"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
