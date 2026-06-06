import type { Team } from "@/types";

type TeamCardProps = {
  team: Team;
};

export default function TeamCard({ team }: TeamCardProps) {
  return (
    <article className="rounded-lg border border-[#72007E]/20 bg-white p-5 shadow-sm">
      <p className="text-sm text-[#F85259]">FRC {team.number}</p>
      <h3 className="mt-1 text-lg text-[#17001C]">{team.name}</h3>
      <p className="mt-3 text-sm leading-6 text-[#17001C]/75">
        {team.description}
      </p>
      <div className="mt-4 flex flex-wrap gap-2 text-xs text-[#72007E]">
        <span>{team.location}</span>
        <span aria-hidden="true">/</span>
        <span>{team.mediaFocus}</span>
      </div>
      <a
        className="font-primary mt-5 inline-flex h-10 items-center justify-center rounded-md bg-[#7137E3] px-4 text-sm text-white hover:bg-[#A335E6]"
        href={team.driveUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        Find clips on Icedrive
      </a>
    </article>
  );
}
