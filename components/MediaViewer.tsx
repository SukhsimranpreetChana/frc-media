"use client";

import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import CreditRequiredBadge from "@/components/CreditRequiredBadge";
import { getCreatedTime, type MediaCollage } from "@/lib/mediaCollages";

type DriveFolderFile = {
  id: string;
  name: string;
  mimeType?: string;
};

type ViewerItem = {
  fileId: string;
  name: string;
  mimeType?: string;
  driveUrl: string;
  uploadedAt?: string;
};

// Matches GoogleDriveFileInfo from lib/googleDrive (a server-only module).
type FileInfo = {
  name: string;
  mimeType?: string;
  sizeBytes?: number;
  width?: number;
  height?: number;
  durationMs?: number;
  takenAt?: string;
  cameraMake?: string;
  cameraModel?: string;
  lens?: string;
  focalLength?: number;
  aperture?: number;
  exposureTime?: number;
  isoSpeed?: number;
};

type MediaViewerProps = {
  collage: MediaCollage;
  initialIndex?: number;
  onClose: () => void;
};

// Mirrors getGoogleDriveFileIdFromUrl, which lives in a server-only module.
function getDriveFileId(fileUrl: string) {
  const filePathMatch = fileUrl.match(/\/file\/d\/([^/?]+)/);

  if (filePathMatch?.[1]) {
    return filePathMatch[1];
  }

  try {
    return new URL(fileUrl).searchParams.get("id") || undefined;
  } catch {
    return undefined;
  }
}

function getPreviewUrl(fileId: string, size?: number) {
  return `/api/media/thumbnail?fileId=${encodeURIComponent(fileId)}${
    size ? `&size=${size}` : ""
  }`;
}

// Files are shared "anyone with the link", so Google serves the original directly.
// confirm=t skips Drive's "too large to scan for viruses" page on big videos.
function getDownloadUrl(fileId: string) {
  return `https://drive.usercontent.google.com/download?id=${encodeURIComponent(fileId)}&export=download&confirm=t`;
}

function isImage(item: ViewerItem) {
  return Boolean(item.mimeType?.startsWith("image/"));
}

function isVideo(item: ViewerItem) {
  return Boolean(item.mimeType?.startsWith("video/"));
}

function getViewerItems(
  collage: MediaCollage,
  folderFiles: DriveFolderFile[],
): ViewerItem[] {
  const folderFilesById = new Map(folderFiles.map((file) => [file.id, file]));

  // Approved clips decide what is shown; the folder listing only adds names and types.
  return [...collage.clips]
    .sort((a, b) => getCreatedTime(a) - getCreatedTime(b))
    .flatMap((clip) => {
      const fileId = getDriveFileId(clip.videoUrl);

      if (!fileId) {
        return [];
      }

      const folderFile = folderFilesById.get(fileId);

      return [
        {
          fileId,
          name: folderFile?.name || clip.title || "Media file",
          mimeType: folderFile?.mimeType,
          driveUrl: clip.videoUrl,
          uploadedAt: clip.createdAt,
        },
      ];
    });
}

function formatBytes(bytes: number) {
  if (bytes >= 1024 ** 3) {
    return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
  }

  if (bytes >= 1024 ** 2) {
    return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function formatDuration(ms: number) {
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, "0");

  return `${minutes}:${seconds}`;
}

function formatExposure(seconds: number) {
  return seconds >= 1 ? `${seconds}s` : `1/${Math.round(1 / seconds)}s`;
}

function formatFileType(mimeType?: string) {
  if (!mimeType) {
    return undefined;
  }

  const [kind, subtype] = mimeType.split("/");
  const format = subtype === "quicktime" ? "MOV" : subtype.toUpperCase();

  return kind === "image" ? `${format} photo` : kind === "video" ? `${format} video` : mimeType;
}

// Camera dates come from EXIF as "2026:09:27 14:03:22".
function formatTakenAt(value: string) {
  const match = value.match(/^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2})/);
  const date = match
    ? new Date(+match[1], +match[2] - 1, +match[3], +match[4], +match[5])
    : new Date(value);

  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function formatDate(value: string) {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(undefined, { dateStyle: "medium" });
}

function InfoRow({ label, value }: { label: string; value?: ReactNode }) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  return (
    <div className="flex justify-between gap-4 py-1.5">
      <dt className="shrink-0 text-[#F4E7E7]/70">{label}</dt>
      <dd className="min-w-0 break-words text-right text-white">{value}</dd>
    </div>
  );
}

function InfoPanel({
  collage,
  item,
  info,
  hasError,
  uploadedBy,
  creditRequired,
  onClose,
}: {
  collage: MediaCollage;
  item: ViewerItem;
  info?: FileInfo;
  hasError: boolean;
  uploadedBy?: string;
  creditRequired: boolean;
  onClose: () => void;
}) {
  const camera = [info?.cameraMake, info?.cameraModel]
    .filter(Boolean)
    .join(" ")
    // Many cameras repeat the make inside the model ("Canon Canon EOS R6").
    .replace(/^(\S+) \1/i, "$1");
  const hasCameraInfo = Boolean(
    camera ||
      info?.lens ||
      info?.focalLength ||
      info?.aperture ||
      info?.exposureTime ||
      info?.isoSpeed ||
      info?.takenAt,
  );

  return (
    <aside
      aria-label="Media details"
      className="media-viewer__info fixed inset-x-0 bottom-0 z-10 max-h-[60vh] overflow-y-auto rounded-t-2xl p-5 text-sm sm:static sm:z-auto sm:h-full sm:max-h-none sm:w-80 sm:shrink-0 sm:rounded-xl"
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base text-white">Details</h3>
        <button
          aria-label="Close details"
          className="media-viewer__tool"
          onClick={onClose}
          type="button"
        >
          <svg aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      <p className="media-viewer__info-heading">Upload</p>
      <dl>
        <InfoRow label="Team" value={`FRC ${collage.teamNumber}`} />
        <InfoRow label="Season" value={collage.year} />
        <InfoRow label="Submitted by" value={uploadedBy} />
        <InfoRow
          label="Uploaded"
          value={item.uploadedAt ? formatDate(item.uploadedAt) : undefined}
        />
        <InfoRow label="Credit" value={creditRequired ? "Required" : "Not required"} />
      </dl>

      <p className="media-viewer__info-heading">File</p>
      <dl>
        <InfoRow label="Name" value={info?.name || item.name} />
        <InfoRow label="Type" value={formatFileType(info?.mimeType || item.mimeType)} />
        <InfoRow
          label="Size"
          value={info?.sizeBytes ? formatBytes(info.sizeBytes) : undefined}
        />
        <InfoRow
          label="Dimensions"
          value={
            info?.width && info.height ? `${info.width} × ${info.height}` : undefined
          }
        />
        <InfoRow
          label="Length"
          value={info?.durationMs ? formatDuration(info.durationMs) : undefined}
        />
      </dl>

      {hasCameraInfo ? (
        <>
          <p className="media-viewer__info-heading">Camera</p>
          <dl>
            <InfoRow label="Camera" value={camera} />
            <InfoRow label="Lens" value={info?.lens} />
            <InfoRow
              label="Focal length"
              value={info?.focalLength ? `${Math.round(info.focalLength)} mm` : undefined}
            />
            <InfoRow
              label="Aperture"
              value={info?.aperture ? `f/${info.aperture}` : undefined}
            />
            <InfoRow
              label="Shutter"
              value={info?.exposureTime ? formatExposure(info.exposureTime) : undefined}
            />
            <InfoRow label="ISO" value={info?.isoSpeed} />
            <InfoRow
              label="Taken"
              value={info?.takenAt ? formatTakenAt(info.takenAt) : undefined}
            />
          </dl>
        </>
      ) : null}

      {!info && !hasError ? (
        <p className="mt-4 text-xs text-[#F4E7E7]/70">Loading file details...</p>
      ) : null}
      {hasError ? (
        <p className="mt-4 text-xs text-[#F4E7E7]/70">
          File details are not available right now.
        </p>
      ) : null}
    </aside>
  );
}

function ViewerToolbar({
  item,
  className,
  canFullscreen,
  isFullscreen,
  isInfoOpen,
  onToggleFullscreen,
  onToggleInfo,
}: {
  item: ViewerItem;
  className: string;
  canFullscreen: boolean;
  isFullscreen: boolean;
  isInfoOpen: boolean;
  onToggleFullscreen: () => void;
  onToggleInfo: () => void;
}) {
  return (
    <div className={`media-viewer__toolbar ${className}`} role="toolbar" aria-label="Media actions">
      {canFullscreen ? (
        <button
          aria-label={isFullscreen ? "Exit fullscreen" : "View fullscreen"}
          className="media-viewer__tool"
          onClick={onToggleFullscreen}
          title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          type="button"
        >
          <svg aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7" />
          </svg>
        </button>
      ) : null}
      <button
        aria-label="Details"
        aria-pressed={isInfoOpen}
        className="media-viewer__tool"
        onClick={onToggleInfo}
        title="Details"
        type="button"
      >
        <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 15h-2v-6h2v6Zm0-8h-2V7h2v2Z" />
        </svg>
      </button>
      <a
        aria-label={`Download ${item.name}`}
        className="media-viewer__tool"
        download
        href={getDownloadUrl(item.fileId)}
        rel="noopener noreferrer"
        title="Download"
      >
        <svg aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
        </svg>
      </a>
    </div>
  );
}

function ViewerStage({
  item,
  isTypeKnown,
}: {
  item: ViewerItem;
  isTypeKnown: boolean;
}) {
  const [isLoaded, setIsLoaded] = useState(false);

  // Wait for the folder listing so a photo does not flash in Drive's player first.
  if (!isTypeKnown) {
    return (
      <p className="text-sm uppercase tracking-wide text-[#F4E7E7]/70">
        Loading...
      </p>
    );
  }

  // Videos, and files whose type we could not look up, use Drive's own player.
  if (!isImage(item)) {
    return (
      <iframe
        allow="autoplay; fullscreen"
        allowFullScreen
        className="h-full w-full rounded-lg border-0 bg-black"
        src={`https://drive.google.com/file/d/${encodeURIComponent(item.fileId)}/preview`}
        title={item.name}
      />
    );
  }

  return (
    <div className="relative flex h-full w-full items-center justify-center">
      {!isLoaded ? (
        <p className="absolute text-sm uppercase tracking-wide text-[#F4E7E7]/70">
          Loading photo...
        </p>
      ) : null}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt={item.name}
        className={`h-full w-full object-contain transition-opacity duration-200 ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
        onLoad={() => setIsLoaded(true)}
        src={getPreviewUrl(item.fileId, 2048)}
      />
    </div>
  );
}

export default function MediaViewer({
  collage,
  initialIndex = 0,
  onClose,
}: MediaViewerProps) {
  const [folderFiles, setFolderFiles] = useState<DriveFolderFile[]>([]);
  // Without a folder there is nothing to look up, so types are as known as they get.
  const [areTypesKnown, setAreTypesKnown] = useState(!collage.folderUrl);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [canUseFullscreen, setCanUseFullscreen] = useState(false);
  const [fileInfo, setFileInfo] = useState<Record<string, FileInfo | "error">>({});
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const activeThumbRef = useRef<HTMLButtonElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const items = useMemo(
    () => getViewerItems(collage, folderFiles),
    [collage, folderFiles],
  );
  const currentItem = items[Math.min(currentIndex, items.length - 1)];
  const currentInfo = currentItem ? fileInfo[currentItem.fileId] : undefined;
  const creditRequired = collage.clips.some((clip) => clip.creditRequired);
  const uploadedBy = collage.clips.find((clip) => clip.uploadedBy)?.uploadedBy;
  // Drive's video player has its own fullscreen button, so ours is for photos only.
  const canFullscreen = Boolean(
    canUseFullscreen && currentItem && isImage(currentItem),
  );

  const showPrevious = useCallback(() => {
    setCurrentIndex((index) => (index - 1 + items.length) % items.length);
  }, [items.length]);

  const showNext = useCallback(() => {
    setCurrentIndex((index) => (index + 1) % items.length);
  }, [items.length]);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void stageRef.current?.requestFullscreen();
    }
  }, []);

  useEffect(() => {
    if (!collage.folderUrl) {
      return;
    }

    let isMounted = true;

    fetch(
      `/api/media/folder-files?folderUrl=${encodeURIComponent(collage.folderUrl)}`,
    )
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { files?: DriveFolderFile[] } | null) => {
        if (isMounted && data?.files) {
          setFolderFiles(data.files);
        }
      })
      .catch(() => {
        // Without types, every file falls back to Drive's player, which still works.
      })
      .finally(() => {
        if (isMounted) {
          setAreTypesKnown(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [collage.folderUrl]);

  // Details are fetched lazily, once per file, only while the panel is open.
  useEffect(() => {
    const fileId = currentItem?.fileId;

    if (!isInfoOpen || !fileId || fileInfo[fileId]) {
      return;
    }

    fetch(`/api/media/file-info?fileId=${encodeURIComponent(fileId)}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { info?: FileInfo } | null) => {
        setFileInfo((current) => ({ ...current, [fileId]: data?.info || "error" }));
      })
      .catch(() => {
        setFileInfo((current) => ({ ...current, [fileId]: "error" }));
      });
  }, [currentItem?.fileId, fileInfo, isInfoOpen]);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleFullscreenChange() {
      setIsFullscreen(document.fullscreenElement === stageRef.current);
    }

    // iPhone Safari cannot fullscreen a photo, so the button only shows where it works.
    window.requestAnimationFrame(() => {
      setCanUseFullscreen(document.fullscreenEnabled);
    });
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("fullscreenchange", handleFullscreenChange);

      if (document.fullscreenElement) {
        void document.exitFullscreen();
      }

      opener?.focus();
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      // While fullscreen, Escape belongs to the browser (it exits fullscreen).
      if (event.key === "Escape" && !document.fullscreenElement) {
        onClose();
      } else if (event.key === "ArrowLeft" && items.length > 1) {
        showPrevious();
      } else if (event.key === "ArrowRight" && items.length > 1) {
        showNext();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [items.length, onClose, showNext, showPrevious]);

  useEffect(() => {
    activeThumbRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [currentIndex]);

  if (!currentItem) {
    return null;
  }

  const toolbarProps = {
    item: currentItem,
    canFullscreen,
    isFullscreen,
    isInfoOpen,
    onToggleFullscreen: toggleFullscreen,
    onToggleInfo: () => setIsInfoOpen((open) => !open),
  };

  return createPortal(
    <div
      aria-label={`${collage.title} media viewer`}
      aria-modal="true"
      className="media-viewer no-route-transition fixed inset-0 z-[90] flex flex-col text-white"
      role="dialog"
    >
      <button
        aria-label="Close media viewer"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        tabIndex={-1}
        type="button"
      />

      <header className="relative flex items-start justify-between gap-4 px-4 pt-4 sm:px-6">
        <div className="min-w-0">
          <p className="scrap-chip inline-flex rounded-md px-2 py-1 text-xs text-[#17001C]">
            FRC {collage.teamNumber}
          </p>
          <h2 className="mt-2 truncate text-lg text-white sm:text-2xl">
            {collage.title}
          </h2>
          <p className="mt-1 text-xs text-[#F4E7E7]/80 sm:text-sm">
            {collage.year}
            {uploadedBy ? ` / Submitted by ${uploadedBy}` : null}
            {items.length > 1
              ? ` / ${currentIndex + 1} of ${items.length}`
              : null}
          </p>
        </div>
        <button
          aria-label="Close"
          className="media-viewer__icon-button shrink-0"
          onClick={onClose}
          ref={closeButtonRef}
          type="button"
        >
          <svg aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </header>

      <div className="pointer-events-none relative flex min-h-0 flex-1 items-center gap-2 px-2 py-4 sm:gap-4 sm:px-6">
        {items.length > 1 ? (
          <button
            aria-label="Previous file"
            className="media-viewer__icon-button pointer-events-auto shrink-0"
            onClick={showPrevious}
            type="button"
          >
            <svg aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </button>
        ) : null}
        <div
          className="media-viewer__stage pointer-events-auto mx-auto flex h-full min-w-0 max-w-6xl flex-1 items-center justify-center"
          onTouchEnd={(event) => {
            const startX = touchStartXRef.current;
            touchStartXRef.current = null;

            if (startX === null || items.length < 2) {
              return;
            }

            // Swipes only reach us on photos; Drive's video player keeps its own touches.
            const distance = event.changedTouches[0].clientX - startX;

            if (Math.abs(distance) > 50) {
              if (distance > 0) {
                showPrevious();
              } else {
                showNext();
              }
            }
          }}
          onTouchStart={(event) => {
            touchStartXRef.current = event.touches[0].clientX;
          }}
          ref={stageRef}
        >
          <ViewerStage
            isTypeKnown={areTypesKnown}
            item={currentItem}
            key={currentItem.fileId}
          />
        </div>
        <ViewerToolbar
          {...toolbarProps}
          className="pointer-events-auto hidden shrink-0 flex-col sm:flex"
        />
        {isInfoOpen ? (
          <div className="pointer-events-auto contents">
            <InfoPanel
              collage={collage}
              creditRequired={creditRequired}
              hasError={currentInfo === "error"}
              info={currentInfo && currentInfo !== "error" ? currentInfo : undefined}
              item={currentItem}
              onClose={() => setIsInfoOpen(false)}
              uploadedBy={uploadedBy}
            />
          </div>
        ) : null}
        {items.length > 1 ? (
          <button
            aria-label="Next file"
            className="media-viewer__icon-button pointer-events-auto shrink-0"
            onClick={showNext}
            type="button"
          >
            <svg aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ) : null}
      </div>

      <footer className="relative flex flex-col gap-3 px-4 pb-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-h-9 flex-wrap items-center gap-x-5 gap-y-2">
            {creditRequired ? <CreditRequiredBadge compact /> : null}
            <a
              className="text-sm font-semibold text-[#F4E7E7] underline decoration-[#F85259] decoration-2 underline-offset-4 hover:text-white"
              href={currentItem.driveUrl}
              rel="noopener noreferrer"
              target="_blank"
            >
              Open in Google Drive
            </a>
          </div>
          <ViewerToolbar {...toolbarProps} className="flex flex-row sm:hidden" />
        </div>
        {items.length > 1 ? (
          <div className="media-viewer__thumbs flex gap-2 overflow-x-auto pb-1">
            {items.map((item, index) => {
              const isCurrent = index === currentIndex;

              return (
                <button
                  aria-current={isCurrent ? "true" : undefined}
                  aria-label={`Show ${item.name}`}
                  className={`media-viewer__thumb ${isCurrent ? "media-viewer__thumb--current" : ""}`}
                  key={item.fileId}
                  onClick={() => setCurrentIndex(index)}
                  ref={isCurrent ? activeThumbRef : undefined}
                  type="button"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img alt="" className="h-full w-full object-cover" loading="lazy" src={getPreviewUrl(item.fileId)} />
                  {isVideo(item) ? (
                    <span aria-hidden="true" className="media-viewer__play-badge">
                      ▶
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        ) : null}
      </footer>
    </div>,
    document.body,
  );
}
