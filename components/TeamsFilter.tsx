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
    <div>
      <label className="block">
        <span className="sr-only">Search teams</span>
        <input
          className="h-11 w-full rounded-md border border-[#72007E]/30 bg-white px-4 text-sm text-[#17001C] outline-none ring-[#A335E6]/20 placeholder:text-[#17001C]/45 focus:border-[#7137E3] focus:ring-4"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search teams by number, name, location, or media focus"
          type="search"
          value={query}
        />
      </label>

      <p className="mt-4 text-sm text-[#17001C]/70">
        Showing {filteredTeams.length} of {teams.length} teams
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {filteredTeams.map((team) => (
          <TeamCard key={team.id} team={team} />
        ))}
      </div>

      {filteredTeams.length === 0 ? (
        <div className="mt-6 rounded-lg border border-dashed border-[#72007E]/40 bg-white p-6 text-sm text-[#17001C]/70">
          No teams found. Try a team number, location, or media type.
        </div>
      ) : null}
    </div>
  );
}
