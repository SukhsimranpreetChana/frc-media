"use client";

import { type CSSProperties, useEffect, useRef, useState } from "react";
import CreditRequiredBadge from "@/components/CreditRequiredBadge";
import MediaViewer from "@/components/MediaViewer";
import {
  getCollageCoverClip,
  type MediaCollage,
} from "@/lib/mediaCollages";

type RecentUploadsCarouselProps = {
  collages: MediaCollage[];
  totalCount?: number;
};

const uploadFetchBatchSize = 18;
const slideDurationMs = 520;
const cardMinWidth = 260;
const cardGap = 16;

function getThumbnailProxyUrl(fileUrl?: string, thumbnailUrl?: string) {
  if (fileUrl) {
    return `/api/media/thumbnail?fileUrl=${encodeURIComponent(fileUrl)}`;
  }

  return thumbnailUrl;
}

function getVisibleCollages(
  collages: MediaCollage[],
  startIndex: number,
  cardsPerPage: number,
) {
  return collages.slice(startIndex, startIndex + cardsPerPage);
}

function getCardsPerPage(width: number) {
  if (width <= 0) {
    return 1;
  }

  return Math.max(1, Math.floor((width + cardGap) / (cardMinWidth + cardGap)));
}

function getCollageCoverUrl(collage: MediaCollage) {
  const coverClip = getCollageCoverClip(collage);

  return getThumbnailProxyUrl(coverClip?.videoUrl, coverClip?.thumbnailUrl);
}

// Image first: the whole card opens the viewer, with a slim caption under the photo.
function RecentUploadCard({ collage }: { collage: MediaCollage }) {
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const coverUrl = getCollageCoverUrl(collage);
  const creditRequired = collage.clips.some((clip) => clip.creditRequired);
  const fileCount = collage.clips.length;

  return (
    <article className="media-card h-full">
      <button
        aria-label={`View ${collage.title}`}
        className="group flex h-full w-full flex-col text-left"
        onClick={() => setIsViewerOpen(true)}
        type="button"
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#17001C]">
          {coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt=""
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              src={coverUrl}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm uppercase tracking-wide text-[#F4E7E7]/85">
              Media preview loading
            </div>
          )}
          {creditRequired ? (
            <span className="absolute left-2 top-2">
              <CreditRequiredBadge compact />
            </span>
          ) : null}
        </div>
        <div className="flex flex-1 flex-col gap-1 p-3">
          <h3 className="line-clamp-1 text-sm text-white">{collage.title}</h3>
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

export default function RecentUploadsCarousel({
  collages,
  totalCount = collages.length,
}: RecentUploadsCarouselProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [loadedCollages, setLoadedCollages] = useState(collages);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cardsPerPage, setCardsPerPage] = useState(1);
  const [previousIndex, setPreviousIndex] = useState<number | null>(null);
  const [slideDirection, setSlideDirection] = useState<"next" | "previous">(
    "next",
  );
  const [animationKey, setAnimationKey] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState("");
  const hasMultipleUploads = totalCount > 1;
  const visibleCollages = getVisibleCollages(
    loadedCollages,
    currentIndex,
    cardsPerPage,
  );
  const previousCollages =
    previousIndex === null
      ? []
      : getVisibleCollages(loadedCollages, previousIndex, cardsPerPage);
  const lastStartIndex = Math.max(0, totalCount - cardsPerPage);
  const canShowPrevious = currentIndex > 0;
  const canShowNext = currentIndex < lastStartIndex;
  const nextIndex = Math.min(lastStartIndex, currentIndex + cardsPerPage);
  const previousButtonIndex = Math.max(0, currentIndex - cardsPerPage);
  const hasMoreUploads = loadedCollages.length < totalCount;
  const preloadedCollages = Array.from(
    new Map(
      [
        ...getVisibleCollages(loadedCollages, nextIndex, cardsPerPage),
        ...getVisibleCollages(
          loadedCollages,
          previousButtonIndex,
          cardsPerPage,
        ),
      ].map((collage) => [collage.id, collage]),
    ).values(),
  );

  useEffect(() => {
    const viewport = viewportRef.current;

    if (!viewport) {
      return;
    }

    function updateCardsPerPage() {
      const currentViewport = viewportRef.current;

      if (!currentViewport) {
        return;
      }

      setCardsPerPage(getCardsPerPage(currentViewport.clientWidth));
    }

    updateCardsPerPage();

    const resizeObserver = new ResizeObserver(updateCardsPerPage);
    resizeObserver.observe(viewport);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    setCurrentIndex((index) => Math.min(index, lastStartIndex));
  }, [lastStartIndex]);

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
      currentIndex + cardsPerPage * 2 >= loadedCollages.length;

    if (nearingLoadedEnd && hasMoreUploads && !isLoadingMore && !loadError) {
      void loadMoreUploads();
    }
  }, [
    currentIndex,
    hasMoreUploads,
    isLoadingMore,
    loadError,
    cardsPerPage,
    loadedCollages.length,
  ]);

  useEffect(() => {
    const needsMoreForCurrentRow =
      currentIndex + cardsPerPage > loadedCollages.length;

    if (needsMoreForCurrentRow && hasMoreUploads && !isLoadingMore && !loadError) {
      void loadMoreUploads();
    }
  }, [
    currentIndex,
    cardsPerPage,
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

    const nextVisibleEnd = nextIndex + cardsPerPage;

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
        <div className="section-heading">
          <h2 className="text-2xl text-[#17001C]">Recently uploaded</h2>
        </div>
        <p className="mt-5 text-sm text-[#17001C]/85">
          No approved uploads have been posted yet.
        </p>
      </section>
    );
  }

  return (
    <section className="recent-uploads-section">
      <div className="section-heading">
        <h2 className="text-2xl text-[#17001C]">Recently uploaded</h2>
      </div>

      <div className="mt-5 grid grid-cols-[auto_1fr_auto] items-center gap-3">
        <button
          aria-label="Show previous recent uploads"
          className="font-primary fmc-button fmc-button--secondary flex h-10 w-10 items-center justify-center text-sm disabled:cursor-not-allowed disabled:opacity-45"
          disabled={!hasMultipleUploads || !canShowPrevious || isAnimating}
          onClick={showPreviousUploads}
          type="button"
        >
          &lt;
        </button>
        <div className="recent-uploads-viewport" ref={viewportRef}>
          {previousIndex !== null ? (
            <div
              className={`recent-uploads-track recent-uploads-track--exit-${slideDirection} recent-uploads-grid`}
              key={`exit-${slideDirection}-${animationKey}`}
              style={
                {
                  "--recent-upload-columns": cardsPerPage,
                } as CSSProperties
              }
            >
              {previousCollages.map((collage) => (
                <RecentUploadCard collage={collage} key={collage.id} />
              ))}
            </div>
          ) : null}
          <div
            className={`recent-uploads-track recent-uploads-track--enter-${slideDirection} recent-uploads-grid`}
            key={`enter-${slideDirection}-${animationKey}`}
            style={
              {
                "--recent-upload-columns": cardsPerPage,
              } as CSSProperties
            }
          >
            {visibleCollages.map((collage) => (
              <RecentUploadCard collage={collage} key={collage.id} />
            ))}
          </div>
        </div>
        <button
          aria-label="Show next recent uploads"
          className="font-primary fmc-button fmc-button--secondary flex h-10 w-10 items-center justify-center text-sm disabled:cursor-not-allowed disabled:opacity-45"
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
