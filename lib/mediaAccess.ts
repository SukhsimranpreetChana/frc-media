import { hasAdminSession } from "@/lib/adminAuth";
import { getGoogleDriveFileIdFromUrl } from "@/lib/googleDrive";
import { getMediaClips } from "@/lib/supabase";

// A page of media asks for many previews at once; without this, each one
// would reload every approved upload just to check its own file id.
const approvedFileIdsTtlMs = 60 * 1000;
let approvedFileIdsCache: { ids: Set<string>; expiresAt: number } | null = null;

async function getApprovedFileIds() {
  if (approvedFileIdsCache && approvedFileIdsCache.expiresAt > Date.now()) {
    return approvedFileIdsCache.ids;
  }

  const approvedClips = await getMediaClips({ approved: true });
  const ids = new Set(
    approvedClips
      .map((clip) => getGoogleDriveFileIdFromUrl(clip.videoUrl))
      .filter((id): id is string => Boolean(id)),
  );

  approvedFileIdsCache = { ids, expiresAt: Date.now() + approvedFileIdsTtlMs };

  return ids;
}

// Public visitors may only read Drive files that belong to approved uploads.
export async function canViewDriveFile(fileId: string) {
  if (await hasAdminSession()) {
    return true;
  }

  return (await getApprovedFileIds()).has(fileId);
}
