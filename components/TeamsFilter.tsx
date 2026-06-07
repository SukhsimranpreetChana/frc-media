"use client";

import { useMemo, useState } from "react";
import TeamCard from "@/components/TeamCard";
import { searchTeams } from "@/lib/search";
import type { Team } from "@/types";

type TeamsFilterProps = {
  teams: Team[];
};

export default function TeamsFilter({ teams }: TeamsFilterProps) {
  const [query, setQuery] = useState("");

  const filteredTeams = useMemo(() => searchTeams(query, teams), [query, teams]);

  return (
    <div className="scrap-card p-5">
      <label className="block">
        <span className="sr-only">Search teams</span>
        <input
          className="h-12 w-full rounded-md border-2 border-[#17001C] bg-[#F4E7E7] px-4 text-sm text-[#17001C] outline-none ring-[#A335E6]/20 placeholder:text-[#17001C]/45 focus:border-[#7137E3] focus:ring-4"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search teams by number, name, location, or media focus"
          type="search"
          value={query}
        />
      </label>

      <p className="mt-4 inline-flex rotate-[-1deg] rounded-md bg-[#F85259] px-3 py-1 text-sm text-white">
        Showing {filteredTeams.length} of {teams.length} teams
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {filteredTeams.map((team) => (
          <TeamCard key={team.id} team={team} />
        ))}
      </div>

      {filteredTeams.length === 0 ? (
        <div className="mt-6 rounded-lg border-2 border-dashed border-[#72007E] bg-[#F4E7E7] p-6 text-sm text-[#17001C]/70">
          No teams found. Try a team number, location, or media type.
        </div>
      ) : null}
    </div>
  );
}
