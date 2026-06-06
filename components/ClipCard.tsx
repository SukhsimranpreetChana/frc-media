import type { Clip } from "@/types";

type ClipCardProps = {
  clip: Clip;
};

export default function ClipCard({ clip }: ClipCardProps) {
  return (
    <article className="rounded-lg border border-[#72007E]/20 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-[#F85259]">{clip.type}</p>
          <h3 className="mt-1 text-lg text-[#17001C]">
            {clip.title}
          </h3>
        </div>
        <span className="rounded-md bg-[#F4E7E7] px-2 py-1 text-xs text-[#72007E]">
          {clip.year}
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-[#17001C]/75">
        {clip.description}
      </p>
      <div className="mt-4 flex flex-wrap gap-2 text-xs text-[#72007E]">
        <span>{clip.creator}</span>
        <span aria-hidden="true">/</span>
        <span>{clip.event}</span>
      </div>
    </article>
  );
}
