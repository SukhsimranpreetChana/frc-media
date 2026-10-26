"use client";

import { useEffect, useMemo, useState } from "react";
import TeamCard from "@/components/TeamCard";
import type { Team } from "@/types";

const teamPool = [
  "16",
  "25",
  "27",
  "33",
  "67",
  "71",
  "78",
  "85",
  "111",
  "112",
  "1114",
  "118",
  "125",
  "148",
  "195",
  "222",
  "233",
  "234",
  "245",
  "247",
  "1678",
  "2056",
  "254",
  "279",
  "291",
  "303",
  "330",
  "341",
  "359",
  "365",
  "384",
  "399",
  "469",
  "494",
  "503",
  "624",
  "696",
  "842",
  "846",
  "862",
  "930",
  "971",
  "973",
  "987",
  "1002",
  "1023",
  "1102",
  "1189",
  "1257",
  "1323",
  "1506",
  "1538",
  "1629",
  "1717",
  "1730",
  "1771",
  "1807",
  "1902",
  "1986",
  "2168",
  "2175",
  "2220",
  "2337",
  "2451",
  "2481",
  "2590",
  "2655",
  "2767",
  "2791",
  "2811",
  "2910",
  "3005",
  "3015",
  "3196",
  "3310",
  "3476",
  "3538",
  "3647",
  "3847",
  "4028",
  "4039",
  "4143",
  "4188",
  "4414",
  "4481",
  "4499",
  "4911",
  "5172",
  "5406",
  "5460",
  "5804",
  "5940",
  "6328",
  "6413",
  "6800",
  "694",
  "7157",
  "7407",
  "7457",
  "8033",
];

const highestChanceTeams = new Set([
  "1114",
  "118",
  "148",
  "1678",
  "2056",
  "254",
  "2767",
  "2910",
  "4414",
  "971",
]);

const higherChanceTeams = new Set([
  "16",
  "25",
  "33",
  "67",
  "111",
  "125",
  "195",
  "233",
  "2451",
  "2481",
  "2590",
  "3476",
  "4481",
  "4911",
  "5172",
  "5406",
  "5940",
  "6328",
  "694",
  "973",
]);

function getTeamWeight(teamNumber: string) {
  if (highestChanceTeams.has(teamNumber)) {
    return 8;
  }

  if (higherChanceTeams.has(teamNumber)) {
    return 4;
  }

  return 1;
}

function pickWeightedTeam(availableTeams: string[]) {
  const totalWeight = availableTeams.reduce(
    (total, teamNumber) => total + getTeamWeight(teamNumber),
    0,
  );
  let targetWeight = Math.random() * totalWeight;

  for (const teamNumber of availableTeams) {
    targetWeight -= getTeamWeight(teamNumber);

    if (targetWeight <= 0) {
      return teamNumber;
    }
  }

  return availableTeams[availableTeams.length - 1];
}

function pickRandomTeams() {
  const availableTeams = [...teamPool];
  const selectedTeams: string[] = [];

  while (selectedTeams.length < 3 && availableTeams.length > 0) {
    const teamNumber = pickWeightedTeam(availableTeams);
    selectedTeams.push(teamNumber);
    availableTeams.splice(availableTeams.indexOf(teamNumber), 1);
  }

  return selectedTeams;
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
      <div className="home-team-preview-grid">
        {selectedTeams.map((teamNumber) => (
          <div
            className="scrap-card min-h-64 animate-pulse p-5"
            key={teamNumber}
          >
            <div className="h-16 w-16 rounded-lg bg-[#F4E7E7]" />
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
    <div className="home-team-preview-grid">
      {teams.map((team) => (
        <TeamCard key={team.id} team={team} />
      ))}
    </div>
  );
}
