import { hasAdminSession } from "@/lib/adminAuth";
import { getGoogleDriveFileIdFromUrl } from "@/lib/googleDrive";
import { getMediaClips } from "@/lib/supabase";

// Public visitors may only read Drive files that belong to approved uploads.
export async function canViewDriveFile(fileId: string) {
  if (await hasAdminSession()) {
    return true;
  }

  const approvedClips = await getMediaClips({ approved: true });

  return approvedClips.some(
    (clip) => getGoogleDriveFileIdFromUrl(clip.videoUrl) === fileId,
  );
}
