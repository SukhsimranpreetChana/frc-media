"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  collaborations,
  getCollaborationThumbnail,
  type Collaboration,
} from "@/lib/collaborations";

const collaborationRequestUrl = "https://discord.gg/VAZAtjwweN";

function CollaborationCard({
  collaboration,
  isCopy,
}: {
  collaboration: Collaboration;
  isCopy: boolean;
}) {
  const [hasImageError, setHasImageError] = useState(false);
  const isYouTube = collaboration.platform === "youtube";
  const thumbnail = getCollaborationThumbnail(collaboration);

  return (
    <article
      aria-hidden={isCopy || undefined}
      className="scrap-card flex w-[18rem] shrink-0 snap-start flex-col overflow-hidden p-0 sm:w-[20rem]"
      inert={isCopy}
    >
      <a
        className="block"
        href={collaboration.url}
        rel="noopener noreferrer"
        target="_blank"
      >
        <div className="aspect-video overflow-hidden bg-[#17001C]">
          {!thumbnail || hasImageError ? (
            <div className="collab-placeholder flex h-full w-full flex-col items-center justify-center gap-2 text-white">
              <svg
                aria-hidden="true"
                className="h-10 w-10"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
                viewBox="0 0 24 24"
              >
                {isYouTube ? (
                  <path d="M9.5 8.5v7l6-3.5-6-3.5ZM3 12c0-3 .3-4.6.8-5.3.6-.8 2.4-1.2 8.2-1.2s7.6.4 8.2 1.2c.5.7.8 2.3.8 5.3s-.3 4.6-.8 5.3c-.6.8-2.4 1.2-8.2 1.2s-7.6-.4-8.2-1.2C3.3 16.6 3 15 3 12Z" />
                ) : (
                  <>
                    <rect height="16" rx="4.5" width="16" x="4" y="4" />
                    <circle cx="12" cy="12" r="3.6" />
                    <circle cx="16.6" cy="7.4" fill="currentColor" r="0.6" />
                  </>
                )}
              </svg>
              <span className="text-sm font-semibold">
                {isYouTube ? "Watch on YouTube" : "View on Instagram"}
              </span>
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt=""
              className="h-full w-full object-cover transition duration-300 hover:scale-105"
              loading="lazy"
              onError={() => setHasImageError(true)}
              src={thumbnail}
            />
          )}
        </div>
      </a>
      <div className="flex flex-1 flex-col p-5">
        <p className="scrap-chip inline-flex w-fit rounded-md px-2 py-1 text-sm text-[#17001C]">
          {isYouTube ? "YouTube" : "Instagram"}
        </p>
        <h3 className="mt-3 mb-4 text-lg leading-tight text-[#17001C]">
          {collaboration.title}
        </h3>
        <a
          className="font-primary fmc-button fmc-button--primary mt-auto inline-flex h-10 items-center justify-center px-4 text-sm"
          href={collaboration.url}
          rel="noopener noreferrer"
          target="_blank"
        >
          {isYouTube ? "Watch collab" : "View post"}
        </a>
      </div>
    </article>
  );
}

export default function CollaborationsShowcase() {
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  // Distance from one copy of the list to the next, measured from the cards.
  const getCopyWidth = useCallback(() => {
    const cards = scrollerRef.current?.children;

    if (!cards || cards.length < collaborations.length * 2) {
      return 0;
    }

    const first = cards[0] as HTMLElement;
    const firstOfMiddle = cards[collaborations.length] as HTMLElement;

    return firstOfMiddle.offsetLeft - first.offsetLeft;
  }, []);

  // Once scrolling settles in the first or last copy, jump by one copy width
  // to the identical spot in the middle copy. The cards there are the same,
  // so the jump is invisible and the row never runs out in either direction.
  const recenter = useCallback(() => {
    const scroller = scrollerRef.current;
    const copyWidth = getCopyWidth();

    if (!scroller || !copyWidth) {
      return;
    }

    if (scroller.scrollLeft < copyWidth - 1) {
      scroller.scrollTo({ left: scroller.scrollLeft + copyWidth, behavior: "instant" });
    } else if (scroller.scrollLeft >= copyWidth * 2 - 1) {
      scroller.scrollTo({ left: scroller.scrollLeft - copyWidth, behavior: "instant" });
    }
  }, [getCopyWidth]);

  useEffect(() => {
    const scroller = scrollerRef.current;

    if (!scroller) {
      return;
    }

    // Start at the beginning of the middle copy.
    scroller.scrollTo({ left: getCopyWidth(), behavior: "instant" });

    // Browsers without "scrollend" get a short pause after the last scroll instead.
    let settleTimer: number | undefined;
    const supportsScrollEnd = "onscrollend" in window;

    function handleScroll() {
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(recenter, 150);
    }

    if (supportsScrollEnd) {
      scroller.addEventListener("scrollend", recenter);
    } else {
      scroller.addEventListener("scroll", handleScroll, { passive: true });
    }

    const resizeObserver = new ResizeObserver(recenter);
    resizeObserver.observe(scroller);

    return () => {
      window.clearTimeout(settleTimer);
      scroller.removeEventListener("scrollend", recenter);
      scroller.removeEventListener("scroll", handleScroll);
      resizeObserver.disconnect();
    };
  }, [getCopyWidth, recenter]);

  function scrollByPage(direction: 1 | -1) {
    const scroller = scrollerRef.current;

    scroller?.scrollBy({
      left: direction * scroller.clientWidth * 0.9,
      behavior: "smooth",
    });
  }

  return (
    <section className="mt-12">
      <div className="section-heading mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-[#72007E]">Collaborations</p>
          <h2 className="text-2xl text-[#17001C]">
            Request a collab or browse existing ones
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <p className="rounded-md bg-[#F85259] px-3 py-1 text-sm text-white">
            Prices may vary
          </p>
          <a
            className="font-primary fmc-button fmc-button--primary inline-flex h-10 items-center justify-center px-4 text-sm"
            href={collaborationRequestUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            Request a collaboration
          </a>
        </div>
      </div>

      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
        <button
          aria-label="Show previous collabs"
          className="font-primary fmc-button fmc-button--secondary flex h-10 w-10 items-center justify-center text-sm"
          onClick={() => scrollByPage(-1)}
          type="button"
        >
          &lt;
        </button>
        <div
          className="collab-scroller flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 pr-2 pt-1"
          ref={scrollerRef}
        >
          {/* Three copies of the list so the row can loop; only the middle one
              is real to keyboards and screen readers. */}
          {[0, 1, 2].flatMap((copy) =>
            collaborations.map((collaboration) => (
              <CollaborationCard
                collaboration={collaboration}
                isCopy={copy !== 1}
                key={`${copy}-${collaboration.id}`}
              />
            )),
          )}
        </div>
        <button
          aria-label="Show more collabs"
          className="font-primary fmc-button fmc-button--secondary flex h-10 w-10 items-center justify-center text-sm"
          onClick={() => scrollByPage(1)}
          type="button"
        >
          &gt;
        </button>
      </div>
    </section>
  );
}
