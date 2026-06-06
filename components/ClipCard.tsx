import type { Clip } from "@/types";

type ClipCardProps = {
  clip: Clip;
};

export default function ClipCard({ clip }: ClipCardProps) {
  return (
    <article className="rounded-lg border border-zinc-200 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-red-700">{clip.type}</p>
          <h3 className="mt-1 text-lg font-semibold text-zinc-950">
            {clip.title}
          </h3>
        </div>
        <span className="rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700">
          {clip.year}
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-zinc-600">{clip.description}</p>
      <div className="mt-4 flex flex-wrap gap-2 text-xs text-zinc-600">
        <span>{clip.creator}</span>
        <span aria-hidden="true">/</span>
        <span>{clip.event}</span>
      </div>
    </article>
  );
}
