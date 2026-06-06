import type { Team } from "@/types";

type TeamCardProps = {
  team: Team;
};

export default function TeamCard({ team }: TeamCardProps) {
  return (
    <article className="rounded-lg border border-zinc-200 bg-white p-5">
      <p className="text-sm font-medium text-red-700">FRC {team.number}</p>
      <h3 className="mt-1 text-lg font-semibold text-zinc-950">{team.name}</h3>
      <p className="mt-3 text-sm leading-6 text-zinc-600">{team.description}</p>
      <div className="mt-4 flex flex-wrap gap-2 text-xs text-zinc-600">
        <span>{team.location}</span>
        <span aria-hidden="true">/</span>
        <span>{team.mediaFocus}</span>
      </div>
      <a
        className="mt-5 inline-flex h-10 items-center justify-center rounded-md border border-zinc-300 px-4 text-sm font-semibold text-zinc-950 hover:bg-zinc-100"
        href={team.driveUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        Find clips on Icedrive
      </a>
    </article>
  );
}
