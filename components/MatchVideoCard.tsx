import type { MatchVideo } from "@/types";

type MatchVideoCardProps = {
  video: MatchVideo;
};

export default function MatchVideoCard({ video }: MatchVideoCardProps) {
  return (
    <article className="scrap-card flex flex-col overflow-hidden p-0">
      <a
        className="block"
        href={video.url}
        rel="noopener noreferrer"
        target="_blank"
      >
        <div className="aspect-video overflow-hidden bg-[#17001C]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt=""
            className="h-full w-full object-cover transition duration-300 hover:scale-105"
            src={video.thumbnailUrl}
          />
        </div>
      </a>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <p className="scrap-chip inline-flex rounded-md px-2 py-1 text-sm text-[#17001C]">
            Match Video
          </p>
          <h3 className="mt-3 text-lg text-[#17001C]">{video.title}</h3>
          <p className="mt-2 text-sm text-[#17001C]/65">
            {video.eventKey} / {video.year} / YouTube
          </p>
        </div>
        <a
          className="font-primary fmc-button mt-auto inline-flex h-10 items-center justify-center bg-[#F85259] px-4 text-sm text-white hover:bg-[#A335E6]"
          href={video.url}
          rel="noopener noreferrer"
          target="_blank"
        >
          Watch Match
        </a>
      </div>
    </article>
  );
}
