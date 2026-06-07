import type { MediaClip } from "@/types";

type MediaClipCardProps = {
  clip: MediaClip;
};

export default function MediaClipCard({ clip }: MediaClipCardProps) {
  const thumbnailUrl = `/api/media/thumbnail?fileUrl=${encodeURIComponent(clip.videoUrl)}`;

  return (
    <article className="fmc-dark-halftone flex flex-col overflow-hidden rounded-2xl border-2 border-[#F85259]/50 text-white shadow-[8px_8px_0_#17001C]">
      <a
        className="block"
        href={clip.videoUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        <div className="aspect-video overflow-hidden bg-[#17001C]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt=""
            className="h-full w-full object-cover transition duration-300 hover:scale-105"
            src={thumbnailUrl || clip.thumbnailUrl}
          />
        </div>
      </a>
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div>
          <p className="scrap-chip inline-flex rounded-md px-2 py-1 text-sm text-[#17001C]">
            FRC {clip.teamNumber}
          </p>
          <h3 className="mt-3 text-xl text-white">
            {clip.title || `${clip.teamNumber} media clip`}
          </h3>
          <p className="mt-2 text-sm text-[#F4E7E7]">
            {clip.year}
            {clip.uploadedBy ? ` / Submitted by ${clip.uploadedBy}` : null}
          </p>
        </div>
        <div className="mt-auto flex flex-col gap-2 sm:flex-row">
          <a
            className="font-primary fmc-button inline-flex h-10 items-center justify-center bg-[#F85259] px-4 text-sm text-white hover:bg-[#A335E6]"
            href={clip.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            View Clip
          </a>
          {!clip.approved ? (
            <span className="font-primary inline-flex h-10 items-center justify-center rounded-md bg-white/10 px-4 text-sm text-[#F4E7E7]">
              Pending
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
