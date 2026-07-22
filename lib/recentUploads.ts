import { getMediaCollages } from "@/lib/mediaCollages";
import { getMediaClips } from "@/lib/supabase";

type RecentUploadOptions = {
  limit?: number;
  offset?: number;
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
