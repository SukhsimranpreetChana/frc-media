import { createClient } from "@supabase/supabase-js";
import type { MediaClip, MediaClipRecord } from "@/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function getSupabaseClient() {
  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL.");
  }

  if (!supabaseAnonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

export function getSupabaseStatus() {
  const connected = Boolean(supabaseUrl && supabaseAnonKey);

  return {
    connected,
    message: connected
      ? "Supabase is configured."
      : "Supabase is not configured yet.",
  };
}

function getSupabaseRestUrl(table: string) {
  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL.");
  }

  return `${supabaseUrl}/rest/v1/${table}`;
}

function getSupabaseHeaders() {
  if (!supabaseAnonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }

  return {
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${supabaseAnonKey}`,
    "Content-Type": "application/json",
  };
}

export function mapMediaClipRecord(record: MediaClipRecord): MediaClip {
  return {
    id: record.id,
    teamNumber: record.team_number,
    year: record.year,
    videoUrl: record.video_url,
    thumbnailUrl: record.thumbnail_url,
    approved: record.approved,
    title: record.title ?? undefined,
    uploadedBy: record.uploaded_by ?? undefined,
    uploadGroupId: record.upload_group_id ?? undefined,
    driveFolderUrl: record.drive_folder_url ?? undefined,
    createdAt: record.created_at,
  };
}

export async function getMediaClips(filters?: {
  teamNumber?: string;
  year?: number;
  approved?: boolean;
  includePending?: boolean;
}) {
  const params = new URLSearchParams({
    select: "*",
    order: "year.desc,created_at.desc",
  });

  if (filters?.teamNumber) {
    params.set("team_number", `eq.${filters.teamNumber}`);
  }

  if (filters?.year) {
    params.set("year", `eq.${filters.year}`);
  }

  if (typeof filters?.approved === "boolean") {
    params.set("approved", `eq.${filters.approved}`);
  } else if (!filters?.includePending) {
    params.set("approved", "eq.true");
  }

  const response = await fetch(
    `${getSupabaseRestUrl("media_clips")}?${params.toString()}`,
    {
      headers: getSupabaseHeaders(),
    },
  );

  if (!response.ok) {
    throw new Error("Unable to load media clips from Supabase.");
  }

  const records = (await response.json()) as MediaClipRecord[];
  return records.map(mapMediaClipRecord);
}

export async function createMediaClip(clip: Omit<MediaClip, "id" | "createdAt">) {
  const record = {
    team_number: clip.teamNumber,
    year: clip.year,
    video_url: clip.videoUrl,
    thumbnail_url: clip.thumbnailUrl,
    approved: clip.approved,
    title: clip.title ?? null,
    uploaded_by: clip.uploadedBy ?? null,
    upload_group_id: clip.uploadGroupId ?? null,
    drive_folder_url: clip.driveFolderUrl ?? null,
  };

  const { data, error } = await getSupabaseClient()
    .from("media_clips")
    .insert(record)
    .select()
    .single<MediaClipRecord>();

  if (error) {
    throw new Error(`Unable to create media clip: ${error.message}`);
  }

  if (!data) {
    throw new Error("Unable to create media clip: no record returned.");
  }

  return mapMediaClipRecord(data);
}

export async function submitPendingClip(input: {
  teamNumber: string;
  year: number;
  videoUrl: string;
  thumbnailUrl: string;
  title?: string;
  uploadedBy?: string;
  uploadGroupId?: string;
  driveFolderUrl?: string;
}) {
  return createMediaClip({
    title: input.title?.trim() || `FRC ${input.teamNumber} submitted clip`,
    teamNumber: input.teamNumber,
    year: input.year,
    videoUrl: input.videoUrl,
    thumbnailUrl: input.thumbnailUrl,
    approved: false,
    uploadedBy: input.uploadedBy?.trim() || undefined,
    uploadGroupId: input.uploadGroupId,
    driveFolderUrl: input.driveFolderUrl,
  });
}

export async function getPendingMediaClips() {
  return getMediaClips({ approved: false });
}

export async function updateMediaClipApproval(id: string, approved: boolean) {
  const { data, error } = await getSupabaseClient()
    .from("media_clips")
    .update({ approved })
    .eq("id", id)
    .select()
    .single<MediaClipRecord>();

  if (error) {
    throw new Error(`Unable to update media clip: ${error.message}`);
  }

  if (!data) {
    throw new Error("Unable to update media clip: no record returned.");
  }

  return mapMediaClipRecord(data);
}

export async function deleteMediaClip(id: string) {
  const { error } = await getSupabaseClient()
    .from("media_clips")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(`Unable to remove media clip: ${error.message}`);
  }
}
