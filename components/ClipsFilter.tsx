"use client";

import { useMemo, useState } from "react";
import MediaClipCard from "@/components/MediaClipCard";
import type { MediaClip } from "@/types";

type ClipsFilterProps = {
  clips: MediaClip[];
};

export default function ClipsFilter({ clips }: ClipsFilterProps) {
  const [teamNumber, setTeamNumber] = useState("");
  const [year, setYear] = useState("");

  const filteredClips = useMemo(() => {
    const normalizedTeam = teamNumber.trim().toLowerCase();
    const normalizedYear = year.trim();

    return clips.filter((clip) => {
      const matchesTeam =
        !normalizedTeam || clip.teamNumber.toLowerCase().includes(normalizedTeam);
      const matchesYear = !normalizedYear || String(clip.year) === normalizedYear;

      return matchesTeam && matchesYear;
    });
  }, [clips, teamNumber, year]);

  return (
    <div className="scrap-card p-5">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm text-[#17001C]/75">
          Team Number
          <input
            className="mt-2 h-11 w-full rounded-md border-2 border-[#17001C] bg-[#F4E7E7] px-4 text-sm text-[#17001C] outline-none ring-[#A335E6]/20 focus:border-[#7137E3] focus:ring-4"
            onChange={(event) => setTeamNumber(event.target.value)}
            placeholder="2056"
            value={teamNumber}
          />
        </label>
        <label className="block text-sm text-[#17001C]/75">
          Year
          <input
            className="mt-2 h-11 w-full rounded-md border-2 border-[#17001C] bg-[#F4E7E7] px-4 text-sm text-[#17001C] outline-none ring-[#A335E6]/20 focus:border-[#7137E3] focus:ring-4"
            onChange={(event) => setYear(event.target.value)}
            placeholder="2025"
            value={year}
          />
        </label>
      </div>

      <p className="mt-4 inline-flex rotate-[-1deg] rounded-md bg-[#F85259] px-3 py-1 text-sm text-white">
        Showing {filteredClips.length} of {clips.length} clips
      </p>

      <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filteredClips.map((clip) => (
          <MediaClipCard clip={clip} key={clip.id} />
        ))}
      </div>

      {filteredClips.length === 0 ? (
        <div className="mt-6 rounded-lg border-2 border-dashed border-[#72007E] bg-[#F4E7E7] p-6 text-sm text-[#17001C]/70">
          No clips match those filters yet.
        </div>
      ) : null}
    </div>
  );
}
