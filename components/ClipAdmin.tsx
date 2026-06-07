"use client";

import { useEffect, useState } from "react";
import type { MediaClip } from "@/types";

type ClipReviewGroup = {
  id: string;
  title: string;
  clips: MediaClip[];
  folderUrl?: string;
  teamNumber: string;
  year: number;
};

function getCreatedTime(clip: MediaClip) {
  return clip.createdAt ? new Date(clip.createdAt).getTime() : 0;
}

function getThumbnailProxyUrl(fileUrl?: string, thumbnailUrl?: string) {
  if (fileUrl) {
    return `/api/media/thumbnail?fileUrl=${encodeURIComponent(fileUrl)}`;
  }

  return thumbnailUrl;
}

function getCoverClip(group: ClipReviewGroup) {
  return [...group.clips].sort(
    (a, b) => getCreatedTime(b) - getCreatedTime(a),
  )[0];
}

function getReviewGroups(clips: MediaClip[]) {
  const groups = new Map<string, ClipReviewGroup>();

  clips.forEach((clip) => {
    const uploadedBy = clip.uploadedBy || "Unknown uploader";
    const groupId =
      clip.uploadGroupId ||
      clip.driveFolderUrl ||
      `${clip.teamNumber}-${clip.year}-${uploadedBy}`;
    const existingGroup = groups.get(groupId);

    if (existingGroup) {
      existingGroup.clips.push(clip);
      existingGroup.folderUrl = existingGroup.folderUrl || clip.driveFolderUrl;
      return;
    }

    groups.set(groupId, {
      id: groupId,
      title: clip.title || `${clip.teamNumber} media by ${uploadedBy}`,
      clips: [clip],
      folderUrl: clip.driveFolderUrl,
      teamNumber: clip.teamNumber,
      year: clip.year,
    });
  });

  return Array.from(groups.values()).sort(
    (a, b) => getCreatedTime(getCoverClip(b)) - getCreatedTime(getCoverClip(a)),
  );
}

export default function ClipAdmin() {
  const [pendingClips, setPendingClips] = useState<MediaClip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeGroupId, setActiveGroupId] = useState("");
  const [resolvedFolderUrls, setResolvedFolderUrls] = useState<Record<string, string>>({});
  const [brokenThumbnailGroupIds, setBrokenThumbnailGroupIds] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState("");
  const reviewGroups = getReviewGroups(pendingClips);

  async function fetchPendingClips() {
    const response = await fetch("/api/admin/media");
    const data = (await response.json().catch(() => null)) as {
      clips?: MediaClip[];
      error?: string;
    } | null;

    if (!response.ok) {
      throw new Error(data?.error || "Could not load pending clips.");
    }

    return data?.clips || [];
  }

  async function loadPendingClips() {
    setIsLoading(true);
    setMessage("");

    try {
      setPendingClips(await fetchPendingClips());
    } catch {
      setMessage("Could not load pending clips. Check admin access.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let isMounted = true;

    async function loadInitialPendingClips() {
      try {
        const clips = await fetchPendingClips();

        if (isMounted) {
          setPendingClips(clips);
        }
      } catch {
        if (isMounted) {
          setMessage("Could not load pending clips. Check admin access.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadInitialPendingClips();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    async function resolveFolderUrl(group: ClipReviewGroup) {
      const coverClip = getCoverClip(group);

      if (group.folderUrl || resolvedFolderUrls[group.id] || !coverClip?.videoUrl) {
        return;
      }

      try {
        const response = await fetch("/api/media/folder-url", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fileUrl: coverClip.videoUrl,
          }),
        });

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as {
          folderUrl?: string;
        };

        if (data.folderUrl) {
          setResolvedFolderUrls((currentUrls) => ({
            ...currentUrls,
            [group.id]: data.folderUrl || "",
          }));
        }
      } catch {
        // The card still falls back to the individual file link.
      }
    }

    reviewGroups.forEach((group) => {
      void resolveFolderUrl(group);
    });
  }, [resolvedFolderUrls, reviewGroups]);

  async function handleApproveGroup(group: ClipReviewGroup) {
    setActiveGroupId(group.id);
    setMessage("");

    try {
      const response = await fetch("/api/admin/media", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clipIds: group.clips.map((clip) => clip.id),
          approved: true,
        }),
      });

      if (!response.ok) {
        throw new Error("Could not approve upload.");
      }

      setPendingClips((clips) =>
        clips.filter(
          (clip) => !group.clips.some((groupClip) => groupClip.id === clip.id),
        ),
      );
      setMessage("Upload approved. All files will now appear in public team searches.");
      window.dispatchEvent(new Event("fmc-media-uploaded"));
    } catch {
      setMessage("Could not approve upload. Check Supabase update policies.");
    } finally {
      setActiveGroupId("");
    }
  }

  async function handleRemoveGroup(group: ClipReviewGroup) {
    setActiveGroupId(group.id);
    setMessage("");

    try {
      const folderUrl = group.folderUrl || resolvedFolderUrls[group.id];
      const response = await fetch("/api/admin/media", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clipIds: group.clips.map((clip) => clip.id),
          folderUrl,
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;

        throw new Error(data?.error || "Could not remove upload.");
      }

      setPendingClips((clips) =>
        clips.filter(
          (clip) => !group.clips.some((groupClip) => groupClip.id === clip.id),
        ),
      );
      setMessage("Pending upload removed from Google Drive and Supabase.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not remove upload. Check Drive access and Supabase delete policies.",
      );
    } finally {
      setActiveGroupId("");
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

      {!isLoading && reviewGroups.length === 0 ? (
        <div className="mt-6 rounded-lg border-2 border-dashed border-[#72007E] bg-[#F4E7E7] p-6 text-sm text-[#17001C]/70">
          No clips are waiting for review right now.
        </div>
      ) : null}

      {!isLoading && reviewGroups.length > 0 ? (
        <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {reviewGroups.map((group) => {
            const coverClip = getCoverClip(group);
            const viewUrl =
              group.folderUrl ||
              resolvedFolderUrls[group.id] ||
              coverClip?.videoUrl ||
              "#";
            const coverUrl = getThumbnailProxyUrl(
              coverClip?.videoUrl,
              coverClip?.thumbnailUrl,
            );
            const hasBrokenThumbnail = brokenThumbnailGroupIds[group.id];

            return (
              <div className="flex flex-col gap-4" key={group.id}>
                <article className="fmc-dark-halftone flex flex-col overflow-hidden rounded-2xl border-2 border-[#F85259]/50 text-white shadow-[8px_8px_0_#17001C]">
                  <a
                    className="block"
                    href={viewUrl}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <div className="aspect-video overflow-hidden bg-[#17001C]">
                      {coverUrl && !hasBrokenThumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          alt=""
                          className="h-full w-full object-cover transition duration-300 hover:scale-105"
                          onError={() =>
                            setBrokenThumbnailGroupIds((groupIds) => ({
                              ...groupIds,
                              [group.id]: true,
                            }))
                          }
                          src={coverUrl}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-[#17001C] text-sm uppercase tracking-wide text-[#F4E7E7]/70">
                          Media preview loading
                        </div>
                      )}
                    </div>
                  </a>
                  <div className="flex flex-1 flex-col gap-4 p-5">
                    <div>
                      <p className="scrap-chip inline-flex rounded-md px-2 py-1 text-sm text-[#17001C]">
                        FRC {group.teamNumber}
                      </p>
                      <h3 className="mt-3 text-xl text-white">{group.title}</h3>
                      <p className="mt-2 text-sm text-[#F4E7E7]">
                        {group.year} / {group.clips.length} file{group.clips.length === 1 ? "" : "s"} pending
                      </p>
                    </div>
                    <div className="mt-auto flex flex-col gap-2 sm:flex-row">
                      <a
                        className="font-primary fmc-button inline-flex h-10 items-center justify-center bg-[#F85259] px-4 text-sm text-white hover:bg-[#A335E6]"
                        href={viewUrl}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        View Clips
                      </a>
                      <span className="font-primary inline-flex h-10 items-center justify-center rounded-md bg-white/10 px-4 text-sm text-[#F4E7E7]">
                        Pending
                      </span>
                    </div>
                  </div>
                </article>

                <div className="flex gap-3">
                  <button
                    className="font-primary fmc-button h-10 flex-1 bg-[#F85259] px-4 text-sm text-white hover:bg-[#A335E6] disabled:opacity-60"
                    disabled={activeGroupId === group.id}
                    onClick={() => void handleApproveGroup(group)}
                    type="button"
                  >
                    Approve
                  </button>
                  <button
                    className="font-primary fmc-button h-10 flex-1 bg-[#17001C] px-4 text-sm text-white hover:bg-[#72007E] disabled:opacity-60"
                    disabled={activeGroupId === group.id}
                    onClick={() => void handleRemoveGroup(group)}
                    type="button"
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
