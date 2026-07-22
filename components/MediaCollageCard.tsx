"use client";

import { useEffect, useMemo, useState } from "react";
import CreditRequiredBadge from "@/components/CreditRequiredBadge";
import type { MediaClip } from "@/types";

export type MediaCollage = {
  id: string;
  title: string;
  clips: MediaClip[];
  folderUrl?: string;
  teamNumber: string;
  year: number;
};

type DriveFolderFile = {
  id: string;
  name: string;
  mimeType?: string;
  viewUrl: string;
  thumbnailUrl?: string;
  createdTime?: string;
  modifiedTime?: string;
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

export function getCollageCoverClip(collage: MediaCollage) {
  return [...collage.clips].sort(
    (a, b) => getCreatedTime(b) - getCreatedTime(a),
  )[0];
}

export default function MediaCollageCard({
  collage,
}: {
  collage: MediaCollage;
}) {
  const [folderFiles, setFolderFiles] = useState<DriveFolderFile[]>([]);
  const [hasCoverError, setHasCoverError] = useState(false);
  const coverClip = getCollageCoverClip(collage);
  const viewUrl = collage.folderUrl || coverClip?.videoUrl || "#";
  const folderCover = useMemo(
    () =>
      folderFiles.find((file) => file.thumbnailUrl && file.mimeType?.startsWith("image/")) ||
      folderFiles.find((file) => file.thumbnailUrl),
    [folderFiles],
  );
  const coverUrl =
    folderCover?.thumbnailUrl ||
    getThumbnailProxyUrl(coverClip?.videoUrl, coverClip?.thumbnailUrl);
  const fileCount = folderFiles.length || collage.clips.length;
  const creditRequired = collage.clips.some((clip) => clip.creditRequired);

  useEffect(() => {
    setHasCoverError(false);
  }, [coverUrl]);

  useEffect(() => {
    if (!collage.folderUrl) {
      setFolderFiles([]);
      return;
    }

    let isMounted = true;

    async function loadFolderFiles() {
      try {
        const response = await fetch(
          `/api/media/folder-files?folderUrl=${encodeURIComponent(collage.folderUrl || "")}`,
        );

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as { files?: DriveFolderFile[] };

        if (isMounted) {
          setFolderFiles(data.files || []);
        }
      } catch {
        if (isMounted) {
          setFolderFiles([]);
        }
      }
    }

    loadFolderFiles();

    return () => {
      isMounted = false;
    };
  }, [collage.folderUrl]);

  return (
    <article className="fmc-dark-halftone flex flex-col overflow-hidden rounded-2xl border-2 border-[#F85259]/50 text-white shadow-[8px_8px_0_#17001C]">
      <a
        className="block"
        href={viewUrl}
        rel="noopener noreferrer"
        target="_blank"
      >
        <div className="aspect-video overflow-hidden bg-[#17001C]">
          {coverUrl && !hasCoverError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt=""
              className="h-full w-full object-cover transition duration-300 hover:scale-105"
              onError={() => setHasCoverError(true)}
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
            FRC {collage.teamNumber}
          </p>
          <h3 className="mt-3 text-xl text-white">{collage.title}</h3>
          <p className="mt-2 text-sm text-[#F4E7E7]">
            {collage.year} / {fileCount} file{fileCount === 1 ? "" : "s"}
          </p>
          {creditRequired ? (
            <div className="mt-3">
              <CreditRequiredBadge />
            </div>
          ) : null}
        </div>
        <a
          className="font-primary fmc-button mt-auto inline-flex h-10 items-center justify-center bg-[#F85259] px-4 text-sm text-white hover:bg-[#A335E6]"
          href={viewUrl}
          rel="noopener noreferrer"
          target="_blank"
        >
          View
        </a>
      </div>
    </article>
  );
}
