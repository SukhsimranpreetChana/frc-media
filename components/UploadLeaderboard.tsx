import { getMediaClips } from "@/lib/supabase";
import type { MediaClip } from "@/types";

type LeaderboardEntry = {
  name: string;
  uploadCount: number;
  teamCount: number;
  latestYear: number;
};

function normalizeUploaderName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function getLeaderboardEntries(clips: MediaClip[]): LeaderboardEntry[] {
  const entries = new Map<
    string,
    {
      displayName: string;
      uploadCount: number;
      teams: Set<string>;
      latestYear: number;
    }
  >();

  clips.forEach((clip) => {
    const displayName = normalizeUploaderName(clip.uploadedBy || "");

    if (!displayName) {
      return;
    }

    const key = displayName.toLocaleLowerCase();
    const existingEntry = entries.get(key);

    if (existingEntry) {
      existingEntry.uploadCount += 1;
      existingEntry.teams.add(clip.teamNumber);
      existingEntry.latestYear = Math.max(existingEntry.latestYear, clip.year);
      return;
    }

    entries.set(key, {
      displayName,
      uploadCount: 1,
      teams: new Set([clip.teamNumber]),
      latestYear: clip.year,
    });
  });

  return [...entries.values()]
    .map((entry) => ({
      name: entry.displayName,
      uploadCount: entry.uploadCount,
      teamCount: entry.teams.size,
      latestYear: entry.latestYear,
    }))
    .sort((firstEntry, secondEntry) => {
      if (secondEntry.uploadCount !== firstEntry.uploadCount) {
        return secondEntry.uploadCount - firstEntry.uploadCount;
      }

      if (secondEntry.latestYear !== firstEntry.latestYear) {
        return secondEntry.latestYear - firstEntry.latestYear;
      }

      return firstEntry.name.localeCompare(secondEntry.name);
    })
    .slice(0, 10);
}

export default async function UploadLeaderboard() {
  let entries: LeaderboardEntry[] = [];

  try {
    const clips = await getMediaClips({ approved: true });
    entries = getLeaderboardEntries(clips);
  } catch {
    entries = [];
  }

  return (
    <aside className="scrap-card h-fit p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-[#72007E]">Global leaderboard</p>
          <h2 className="mt-1 text-lg text-[#17001C]">Top uploaders</h2>
        </div>
        <span className="rounded-md border-2 border-[#17001C] bg-[#F4E7E7] px-3 py-1 text-xs font-semibold text-[#17001C]">
          Approved
        </span>
      </div>

      {entries.length > 0 ? (
        <ol className="mt-5 grid gap-3">
          {entries.map((entry, index) => (
            <li
              className="flex items-center gap-3 rounded-md border-2 border-[#17001C]/15 bg-white/75 p-3"
              key={entry.name}
            >
              <span className="font-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#17001C] text-sm text-white">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="overflow-wrap-anywhere text-sm font-bold text-[#17001C]">
                  {entry.name}
                </p>
                <p className="mt-1 text-xs text-[#17001C]/60">
                  {entry.teamCount} team{entry.teamCount === 1 ? "" : "s"} /
                  latest {entry.latestYear}
                </p>
              </div>
              <div className="text-right">
                <p className="font-primary text-xl text-[#72007E]">
                  {entry.uploadCount}
                </p>
                <p className="text-[11px] uppercase text-[#17001C]/50">
                  uploads
                </p>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-5 rounded-md border-2 border-[#17001C]/15 bg-white/75 p-3 text-sm text-[#17001C]/70">
          No approved uploads yet.
        </p>
      )}
    </aside>
  );
}
