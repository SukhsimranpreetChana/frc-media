import { getMediaCollages, type MediaCollage } from "@/lib/mediaCollages";
import { getMediaClips } from "@/lib/supabase";
import type { MediaClip } from "@/types";

type RecentUploadOptions = {
  limit?: number;
  offset?: number;
};

export type MediaStats = {
  files: number;
  teams: number;
  creators: number;
};

export async function getRecentUploadCollages({
  limit = 9,
  offset = 0,
}: RecentUploadOptions = {}) {
  try {
    const clips = await getMediaClips({ approved: true });
    const collages = getMediaCollages(clips);
    const start = Math.max(0, offset);
    const end = start + Math.max(1, limit);

    return {
      collages: collages.slice(start, end),
      totalCount: collages.length,
    };
  } catch {
    return {
      collages: [],
      totalCount: 0,
    };
  }
}

function getMediaStats(clips: MediaClip[]): MediaStats {
  // Anonymous uploads all share one name, so they are not counted as creators.
  const creators = new Set(
    clips
      .map((clip) => clip.uploadedBy?.trim().toLowerCase())
      .filter((name): name is string => Boolean(name) && name !== "anonymous"),
  );

  return {
    files: clips.length,
    teams: new Set(clips.map((clip) => clip.teamNumber)).size,
    creators: creators.size,
  };
}

function shuffle<T>(items: T[]) {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

// Random picks from the archive, one per team. The recent uploads row already shows the newest
// collages right below the hero, so those are skipped here to avoid repeating the same photos.
function getWallCollages(collages: MediaCollage[], count: number, skipNewest: number) {
  const seenTeams = new Set<string>();

  return shuffle(collages.slice(skipNewest))
    .filter((collage) => {
      if (seenTeams.has(collage.teamNumber)) {
        return false;
      }

      seenTeams.add(collage.teamNumber);
      return true;
    })
    .slice(0, count);
}

// Everything the home page needs from one read of the approved uploads.
export async function getHomeMedia({ limit = 9, wallCount = 5 } = {}) {
  try {
    const clips = await getMediaClips({ approved: true });
    const collages = getMediaCollages(clips);

    return {
      collages: collages.slice(0, limit),
      wallCollages: getWallCollages(collages, wallCount, limit),
      totalCount: collages.length,
      stats: getMediaStats(clips),
    };
  } catch {
    return {
      collages: [],
      wallCollages: [],
      totalCount: 0,
      stats: { files: 0, teams: 0, creators: 0 },
    };
  }
}
