"use client";

import { useEffect, useMemo, useState } from "react";
import CreditRequiredBadge from "@/components/CreditRequiredBadge";
import MediaViewer from "@/components/MediaViewer";
import {
  getCollageCoverClip,
  getCreatedTime,
  type MediaCollage,
} from "@/lib/mediaCollages";

export { getCollageCoverClip };
export type { MediaCollage };

type DriveFolderFile = {
  id: string;
  name: string;
  mimeType?: string;
  viewUrl: string;
  thumbnailUrl?: string;
  createdTime?: string;
  modifiedTime?: string;
};

function getThumbnailProxyUrl(fileUrl?: string, thumbnailUrl?: string) {
  if (fileUrl) {
    return `/api/media/thumbnail?fileUrl=${encodeURIComponent(fileUrl)}`;
  }

  return thumbnailUrl;
}

export default function MediaCollageCard({
  collage,
}: {
  collage: MediaCollage;
}) {
  const [folderFiles, setFolderFiles] = useState<DriveFolderFile[]>([]);
  const [hasCoverError, setHasCoverError] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const coverClip = getCollageCoverClip(collage);
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
    <article className="media-card h-full">
      {/* Image first: the whole card opens the viewer, with a slim caption under the photo. */}
      <button
        aria-label={`View ${collage.title}`}
        className="group flex h-full w-full flex-col text-left"
        onClick={() => setIsViewerOpen(true)}
        type="button"
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#17001C]">
          {coverUrl && !hasCoverError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt=""
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              onError={() => setHasCoverError(true)}
              src={coverUrl}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#17001C] text-sm uppercase tracking-wide text-[#F4E7E7]/85">
              Media preview loading
            </div>
          )}
          {creditRequired ? (
            <span className="absolute left-2 top-2">
              <CreditRequiredBadge compact />
            </span>
          ) : null}
        </div>
        <div className="flex flex-1 flex-col gap-1 p-4">
          <h3 className="line-clamp-2 text-base text-white">{collage.title}</h3>
          <p className="text-sm text-[#F4E7E7]/85">
            FRC {collage.teamNumber} · {collage.year} · {fileCount} file
            {fileCount === 1 ? "" : "s"}
          </p>
        </div>
      </button>
      {isViewerOpen ? (
        <MediaViewer collage={collage} onClose={() => setIsViewerOpen(false)} />
      ) : null}
    </article>
  );
}
