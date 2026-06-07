"use client";

import { useEffect, useMemo, useState } from "react";
import TeamCard from "@/components/TeamCard";
import type { Team } from "@/types";

const teamPool = [
  "1114",
  "118",
  "148",
  "1678",
  "2056",
  "254",
  "2910",
  "4414",
  "4481",
  "6328",
  "694",
  "971",
];

function pickRandomTeams() {
  return [...teamPool].sort(() => Math.random() - 0.5).slice(0, 3);
}

export default function RandomTeamsPreview() {
  const selectedTeams = useMemo(() => pickRandomTeams(), []);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function loadTeams() {
      setIsLoading(true);

      try {
        const loadedTeams = await Promise.all(
          selectedTeams.map(async (teamNumber) => {
            const response = await fetch(`/api/team/${teamNumber}`, {
              signal: controller.signal,
            });

            if (!response.ok) {
              return null;
            }

            return (await response.json()) as Team;
          }),
        );

        if (!controller.signal.aborted) {
          setTeams(loadedTeams.filter(Boolean) as Team[]);
        }
      } catch {
        if (!controller.signal.aborted) {
          setTeams([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadTeams();

    return () => {
      controller.abort();
    };
  }, [selectedTeams]);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {selectedTeams.map((teamNumber) => (
          <div
            className="scrap-card min-h-64 animate-pulse p-5"
            key={teamNumber}
          >
            <div className="h-16 w-16 rounded-full bg-[#F4E7E7]" />
            <div className="mt-5 h-5 w-28 rounded-md bg-[#F4E7E7]" />
            <div className="mt-4 h-4 w-full rounded-md bg-[#F4E7E7]" />
            <div className="mt-3 h-4 w-3/4 rounded-md bg-[#F4E7E7]" />
          </div>
        ))}
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-[#72007E] bg-[#F4E7E7] p-6 text-sm text-[#17001C]/70">
        Team previews are loading slowly. Open the Teams tab to search directly.
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {teams.map((team) => (
        <TeamCard key={team.id} team={team} />
      ))}
    </div>
  );
}
