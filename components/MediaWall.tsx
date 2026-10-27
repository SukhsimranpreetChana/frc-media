"use client";

import Image from "next/image";
import { useState } from "react";
import MediaViewer from "@/components/MediaViewer";
import {
  getCollageCoverClip,
  getCreatedTime,
  type MediaCollage,
} from "@/lib/mediaCollages";

type MediaWallProps = {
  collages: MediaCollage[];
};

// Shown until there are enough real uploads to fill the wall.
const fallbackPhotos = [
  {
    src: "/media/alex-5193-detail.jpg",
    alt: "Robot detail seen through clear polycarbonate",
    credit: "Photo taken by FMC Member Alex on 5193.",
  },
  {
    src: "/media/event-overview.png",
    alt: "FIRST event floor with teams and spectators",
    credit: "Photo taken by FMC Member Sukh on 2056.",
  },
  {
    src: "/media/alex-5193-field.jpg",
    alt: "FIRST Robotics field with game pieces in motion",
    credit: "Photo taken by FMC Member Alex on 5193.",
  },
];

function getPreviewUrl(fileUrl: string, size: number) {
  return `/api/media/thumbnail?fileUrl=${encodeURIComponent(fileUrl)}&size=${size}`;
}

// The viewer lists files oldest first, so find where the cover photo lands.
function getCoverIndex(collage: MediaCollage) {
  const cover = getCollageCoverClip(collage);

  return Math.max(
    0,
    [...collage.clips]
      .sort((a, b) => getCreatedTime(a) - getCreatedTime(b))
      .findIndex((clip) => clip.id === cover?.id),
  );
}

export default function MediaWall({ collages }: MediaWallProps) {
  const [openCollage, setOpenCollage] = useState<MediaCollage | null>(null);

  if (collages.length < 3) {
    return (
      <div className="media-wall media-wall--fallback">
        {fallbackPhotos.map((photo, index) => (
          <figure className="media-wall__tile group" key={photo.src}>
            <Image
              alt={photo.alt}
              className="object-cover"
              fill
              priority={index === 0}
              sizes="(min-width: 1024px) 40vw, 90vw"
              src={photo.src}
            />
            <span className="photo-credit">{photo.credit}</span>
          </figure>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="media-wall">
        {collages.map((collage, index) => {
          const cover = getCollageCoverClip(collage);

          if (!cover) {
            return null;
          }

          return (
            <button
              aria-label={`View ${collage.title}`}
              className="media-wall__tile"
              key={collage.id}
              onClick={() => setOpenCollage(collage)}
              type="button"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt=""
                className="h-full w-full object-cover"
                fetchPriority={index === 0 ? "high" : undefined}
                src={getPreviewUrl(cover.videoUrl, index === 0 ? 800 : 400)}
              />
              <span className="media-wall__caption">FRC {collage.teamNumber}</span>
            </button>
          );
        })}
      </div>
      {openCollage ? (
        <MediaViewer
          collage={openCollage}
          initialIndex={getCoverIndex(openCollage)}
          onClose={() => setOpenCollage(null)}
        />
      ) : null}
    </>
  );
}
