import type { MediaClip } from "@/types";

export type MediaCollage = {
  id: string;
  title: string;
  clips: MediaClip[];
  folderUrl?: string;
  teamNumber: string;
  year: number;
};

export function getCreatedTime(clip: MediaClip) {
  return clip.createdAt ? new Date(clip.createdAt).getTime() : 0;
}

export function sortMediaClips(clips: MediaClip[]) {
  return [...clips].sort(
    (a, b) => b.year - a.year || getCreatedTime(b) - getCreatedTime(a),
  );
}

export function getCollageCoverClip(collage: MediaCollage) {
  return [...collage.clips].sort(
    (a, b) => getCreatedTime(b) - getCreatedTime(a),
  )[0];
}

export function getMediaCollages(clips: MediaClip[]) {
  const groups = new Map<string, MediaCollage>();

  sortMediaClips(clips).forEach((clip) => {
    const uploadedBy = clip.uploadedBy || "Unknown uploader";
    const groupId =
      clip.uploadGroupId ||
      clip.driveFolderUrl ||
      `${clip.teamNumber}-${clip.year}-${uploadedBy}`;
    const existingGroup = groups.get(groupId);

    if (existingGroup) {
      existingGroup.clips.push(clip);
      existingGroup.folderUrl = existingGroup.folderUrl || clip.driveFolderUrl;
      return;
    }

    groups.set(groupId, {
      id: groupId,
      title: clip.title || `${clip.teamNumber} media by ${uploadedBy}`,
      clips: [clip],
      folderUrl: clip.driveFolderUrl,
      teamNumber: clip.teamNumber,
      year: clip.year,
    });
  });

  return Array.from(groups.values()).sort((a, b) => {
    const aCover = getCollageCoverClip(a);
    const bCover = getCollageCoverClip(b);

    return b.year - a.year || getCreatedTime(bCover) - getCreatedTime(aCover);
  });
}
