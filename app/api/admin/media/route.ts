import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { deleteGoogleDriveFileOrFolder } from "@/lib/googleDrive";
import {
  deleteMediaClipForAdmin,
  getPendingMediaClipsForAdmin,
  updateMediaClipApproval,
} from "@/lib/supabase";

export const runtime = "nodejs";

function parseClipIds(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((id) => (typeof id === "string" ? id.trim() : ""))
    .filter((id) => /^[0-9a-fA-F-]{36}$/.test(id));
}

export async function GET(request: Request) {
  const unauthorized = await requireAdmin(request);

  if (unauthorized) {
    return unauthorized;
  }

  try {
    return NextResponse.json({ clips: await getPendingMediaClipsForAdmin() });
  } catch {
    return NextResponse.json(
      { error: "Unable to load pending clips." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  const unauthorized = await requireAdmin(request);

  if (unauthorized) {
    return unauthorized;
  }

  const payload = (await request.json().catch(() => null)) as {
    clipIds?: unknown;
    approved?: unknown;
  } | null;
  const clipIds = parseClipIds(payload?.clipIds);
  const approved = payload?.approved === true;

  if (clipIds.length === 0) {
    return NextResponse.json({ error: "Missing clip ids." }, { status: 400 });
  }

  try {
    await Promise.all(
      clipIds.map((clipId) => updateMediaClipApproval(clipId, approved)),
    );

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Unable to update pending clips." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const unauthorized = await requireAdmin(request);

  if (unauthorized) {
    return unauthorized;
  }

  const payload = (await request.json().catch(() => null)) as {
    clipIds?: unknown;
    folderUrl?: string;
  } | null;
  const clipIds = parseClipIds(payload?.clipIds);
  const folderUrl = payload?.folderUrl?.trim();

  if (clipIds.length === 0) {
    return NextResponse.json({ error: "Missing clip ids." }, { status: 400 });
  }

  try {
    if (folderUrl) {
      await deleteGoogleDriveFileOrFolder(folderUrl);
    }

    await Promise.all(clipIds.map((clipId) => deleteMediaClipForAdmin(clipId)));

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Unable to remove pending upload." },
      { status: 500 },
    );
  }
}
