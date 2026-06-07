import type { Team } from "@/types";

type TeamCardProps = {
  team: Team;
};

export default function TeamCard({ team }: TeamCardProps) {
  return (
    <article className="scrap-card flex h-full flex-col p-5">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#17001C] bg-[#F4E7E7] text-center text-sm text-[#17001C] shadow-[4px_4px_0_#F85259]">
          {team.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt=""
              className="h-full w-full object-contain p-1"
              src={team.logoUrl}
            />
          ) : (
            <span className="font-primary">{team.number}</span>
          )}
        </div>
        <div className="min-w-0">
          <p className="scrap-chip inline-flex rounded-md px-2 py-1 text-sm text-[#17001C]">
            FRC {team.number}
          </p>
        </div>
      </div>
      <h3 className="mt-3 overflow-wrap-anywhere text-lg leading-tight text-[#17001C]">
        {team.name}
      </h3>
      <p className="mt-2 text-sm leading-5 text-[#17001C]/75">
        {team.description}
      </p>
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-[#72007E]">
        <span>{team.location}</span>
        <span aria-hidden="true">/</span>
        <span>{team.mediaFocus}</span>
      </div>
      <a
        className="font-primary fmc-button mt-auto inline-flex h-10 items-center justify-center bg-[#7137E3] px-4 text-sm text-white hover:bg-[#A335E6]"
        href={team.driveUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        Find clips on Icedrive
      </a>
    </article>
  );
}
