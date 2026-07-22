"use client";

import { useEffect, useState } from "react";
import CreditRequiredBadge from "@/components/CreditRequiredBadge";
import {
  getCollageCoverClip,
  type MediaCollage,
} from "@/lib/mediaCollages";

type RecentUploadsCarouselProps = {
  collages: MediaCollage[];
  totalCount?: number;
};

const uploadsPerPage = 3;
const uploadFetchBatchSize = 9;
const slideDurationMs = 520;

function getThumbnailProxyUrl(fileUrl?: string, thumbnailUrl?: string) {
  if (fileUrl) {
    return `/api/media/thumbnail?fileUrl=${encodeURIComponent(fileUrl)}`;
  }

  return thumbnailUrl;
}

function getVisibleCollages(collages: MediaCollage[], startIndex: number) {
  return collages.slice(startIndex, startIndex + uploadsPerPage);
}

function getCollageCoverUrl(collage: MediaCollage) {
  const coverClip = getCollageCoverClip(collage);

  return getThumbnailProxyUrl(coverClip?.videoUrl, coverClip?.thumbnailUrl);
}

function RecentUploadCard({ collage }: { collage: MediaCollage }) {
  const coverClip = getCollageCoverClip(collage);
  const viewUrl = collage.folderUrl || coverClip?.videoUrl || "#";
  const coverUrl = getCollageCoverUrl(collage);
  const creditRequired = collage.clips.some((clip) => clip.creditRequired);

  return (
    <article className="fmc-dark-halftone flex min-h-72 flex-col overflow-hidden rounded-lg border-2 border-[#F85259]/50 text-white shadow-[5px_5px_0_#17001C]">
      <a
        className="block"
        href={viewUrl}
        rel="noopener noreferrer"
        target="_blank"
      >
        <div className="aspect-video overflow-hidden bg-[#17001C]">
          {coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt=""
              className="h-full w-full object-cover transition duration-300 hover:scale-105"
              src={coverUrl}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs uppercase tracking-wide text-[#F4E7E7]/70">
              Media preview loading
            </div>
          )}
        </div>
      </a>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <p className="scrap-chip inline-flex rounded-md px-2 py-1 text-xs text-[#17001C]">
            FRC {collage.teamNumber}
          </p>
          <h3 className="mt-3 line-clamp-2 text-base text-white">
            {collage.title}
          </h3>
          <p className="mt-2 text-xs text-[#F4E7E7]">
            {collage.year} / {collage.clips.length} file
            {collage.clips.length === 1 ? "" : "s"}
          </p>
          {creditRequired ? (
            <div className="mt-3">
              <CreditRequiredBadge compact />
            </div>
          ) : null}
        </div>
        <a
          className="font-primary fmc-button mt-auto inline-flex h-9 items-center justify-center bg-[#F85259] px-3 text-xs text-white hover:bg-[#A335E6]"
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

export default function RecentUploadsCarousel({
  collages,
  totalCount = collages.length,
}: RecentUploadsCarouselProps) {
  const [loadedCollages, setLoadedCollages] = useState(collages);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [previousIndex, setPreviousIndex] = useState<number | null>(null);
  const [slideDirection, setSlideDirection] = useState<"next" | "previous">(
    "next",
  );
  const [animationKey, setAnimationKey] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState("");
  const hasMultipleUploads = totalCount > 1;
  const visibleCollages = getVisibleCollages(loadedCollages, currentIndex);
  const previousCollages =
    previousIndex === null
      ? []
      : getVisibleCollages(loadedCollages, previousIndex);
  const lastStartIndex = Math.max(0, totalCount - 1);
  const canShowPrevious = currentIndex > 0;
  const canShowNext = currentIndex < lastStartIndex;
  const nextIndex = Math.min(lastStartIndex, currentIndex + 1);
  const previousButtonIndex = Math.max(0, currentIndex - 1);
  const hasMoreUploads = loadedCollages.length < totalCount;
  const preloadedCollages = Array.from(
    new Map(
      [
        ...getVisibleCollages(loadedCollages, nextIndex),
        ...getVisibleCollages(loadedCollages, previousButtonIndex),
      ].map((collage) => [collage.id, collage]),
    ).values(),
  );

  useEffect(() => {
    if (previousIndex === null) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setPreviousIndex(null);
      setIsAnimating(false);
    }, slideDurationMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [animationKey, previousIndex]);

  useEffect(() => {
    setLoadedCollages(collages);
    setCurrentIndex(0);
    setPreviousIndex(null);
    setIsAnimating(false);
    setLoadError("");
  }, [collages]);

  async function loadMoreUploads() {
    if (isLoadingMore || !hasMoreUploads) {
      return loadedCollages;
    }

    setIsLoadingMore(true);
    setLoadError("");

    try {
      const params = new URLSearchParams({
        limit: String(uploadFetchBatchSize),
        offset: String(loadedCollages.length),
      });
      const response = await fetch(`/api/media/recent-uploads?${params}`);

      if (!response.ok) {
        throw new Error("Unable to load more recent uploads.");
      }

      const data = (await response.json()) as {
        collages?: MediaCollage[];
        totalCount?: number;
      };
      const incomingCollages = data.collages || [];

      if (incomingCollages.length === 0) {
        throw new Error("No more uploads were returned.");
      }

      const nextCollages = Array.from(
        new Map(
          [...loadedCollages, ...incomingCollages].map((collage) => [
            collage.id,
            collage,
          ]),
        ).values(),
      );

      setLoadedCollages(nextCollages);
      return nextCollages;
    } catch {
      setLoadError("Could not load more uploads. Please try again.");
      return loadedCollages;
    } finally {
      setIsLoadingMore(false);
    }
  }

  useEffect(() => {
    const nearingLoadedEnd =
      currentIndex + uploadsPerPage * 2 >= loadedCollages.length;

    if (nearingLoadedEnd && hasMoreUploads && !isLoadingMore && !loadError) {
      void loadMoreUploads();
    }
  }, [
    currentIndex,
    hasMoreUploads,
    isLoadingMore,
    loadError,
    loadedCollages.length,
  ]);

  function showPreviousUploads() {
    if (isAnimating) {
      return;
    }

    setIsAnimating(true);
    setSlideDirection("previous");
    setPreviousIndex(currentIndex);
    setAnimationKey((key) => key + 1);
    setCurrentIndex(previousButtonIndex);
  }

  async function showNextUploads() {
    if (isAnimating || !canShowNext) {
      return;
    }

    const nextVisibleEnd = nextIndex + uploadsPerPage;

    if (nextVisibleEnd > loadedCollages.length && hasMoreUploads) {
      const nextCollages = await loadMoreUploads();

      if (nextVisibleEnd > nextCollages.length) {
        return;
      }
    }

    setIsAnimating(true);
    setSlideDirection("next");
    setPreviousIndex(currentIndex);
    setAnimationKey((key) => key + 1);
    setCurrentIndex(nextIndex);
  }

  if (totalCount === 0) {
    return (
      <section className="recent-uploads-section">
        <div className="border-b-4 border-[#F85259] pb-3">
          <p className="text-sm text-[#72007E]">RECENT UPLOADS</p>
          <h2 className="text-2xl text-[#17001C]">Recently uploaded</h2>
        </div>
        <p className="mt-5 text-sm text-[#17001C]/70">
          No approved uploads have been posted yet.
        </p>
      </section>
    );
  }

  return (
    <section className="recent-uploads-section">
      <div className="flex flex-col gap-4 border-b-4 border-[#F85259] pb-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-[#72007E]">RECENT UPLOADS</p>
          <h2 className="text-2xl text-[#17001C]">Recently uploaded</h2>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-[auto_1fr_auto] items-center gap-3">
        <button
          aria-label="Show previous recent uploads"
          className="font-primary fmc-button flex h-10 w-10 items-center justify-center bg-[#17001C] text-sm text-white hover:bg-[#72007E] disabled:cursor-not-allowed disabled:opacity-45"
          disabled={!hasMultipleUploads || !canShowPrevious || isAnimating}
          onClick={showPreviousUploads}
          type="button"
        >
          &lt;
        </button>
        <div className="recent-uploads-viewport">
          {previousIndex !== null ? (
            <div
              className={`recent-uploads-track recent-uploads-track--exit-${slideDirection} grid gap-4 md:grid-cols-3`}
              key={`exit-${slideDirection}-${animationKey}`}
            >
              {previousCollages.map((collage) => (
                <RecentUploadCard collage={collage} key={collage.id} />
              ))}
            </div>
          ) : null}
          <div
            className={`recent-uploads-track recent-uploads-track--enter-${slideDirection} grid gap-4 md:grid-cols-3`}
            key={`enter-${slideDirection}-${animationKey}`}
          >
            {visibleCollages.map((collage) => (
              <RecentUploadCard collage={collage} key={collage.id} />
            ))}
          </div>
        </div>
        <button
          aria-label="Show next recent uploads"
          className="font-primary fmc-button flex h-10 w-10 items-center justify-center bg-[#7137E3] text-sm text-white hover:bg-[#A335E6] disabled:cursor-not-allowed disabled:opacity-45"
          disabled={
            !hasMultipleUploads || !canShowNext || isAnimating || isLoadingMore
          }
          onClick={showNextUploads}
          type="button"
        >
          {isLoadingMore ? "..." : ">"}
        </button>
      </div>
      {loadError ? (
        <p className="mt-3 text-sm text-[#72007E]">{loadError}</p>
      ) : null}
      <div aria-hidden="true" className="hidden">
        {preloadedCollages.map((collage) => {
          const coverUrl = getCollageCoverUrl(collage);

          return coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt="" key={`${collage.id}-${coverUrl}`} src={coverUrl} />
          ) : null;
        })}
      </div>
    </section>
  );
}
