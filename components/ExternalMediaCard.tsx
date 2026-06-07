import type { ExternalMediaItem } from "@/types";

type ExternalMediaCardProps = {
  item: ExternalMediaItem;
};

export default function ExternalMediaCard({ item }: ExternalMediaCardProps) {
  return (
    <article className="scrap-card flex flex-col overflow-hidden p-0">
      <a
        className="block"
        href={item.url}
        rel="noopener noreferrer"
        target="_blank"
      >
        <div className="aspect-video overflow-hidden bg-[#17001C]">
          {item.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt=""
              className="h-full w-full object-cover transition duration-300 hover:scale-105"
              src={item.thumbnailUrl}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center px-6 text-center text-sm text-[#F4E7E7]">
              External media
            </div>
          )}
        </div>
      </a>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <p className="scrap-chip inline-flex rounded-md px-2 py-1 text-sm text-[#17001C]">
            {item.label}
          </p>
          <h3 className="mt-3 text-lg text-[#17001C]">{item.title}</h3>
          <p className="mt-2 text-sm text-[#17001C]/65">
            {item.year ? `${item.year} / ` : null}
            {item.source === "tba" ? "The Blue Alliance" : "YouTube"}
          </p>
        </div>
        <a
          className="font-primary fmc-button mt-auto inline-flex h-10 items-center justify-center bg-[#7137E3] px-4 text-sm text-white hover:bg-[#A335E6]"
          href={item.url}
          rel="noopener noreferrer"
          target="_blank"
        >
          Open
        </a>
      </div>
    </article>
  );
}
