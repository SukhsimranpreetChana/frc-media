import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/adminAuth";
import {
  getGoogleDriveFileIdFromUrl,
  getGoogleDrivePreviewImage,
} from "@/lib/googleDrive";
import { getMediaClips } from "@/lib/supabase";

export const runtime = "nodejs";

async function canPreviewFile(fileId: string) {
  if (await hasAdminSession()) {
    return true;
  }

  const approvedClips = await getMediaClips({ approved: true });

  return approvedClips.some(
    (clip) => getGoogleDriveFileIdFromUrl(clip.videoUrl) === fileId,
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fileId =
    searchParams.get("fileId") ||
    getGoogleDriveFileIdFromUrl(searchParams.get("fileUrl") || "");

  if (!fileId) {
    return NextResponse.json(
      { error: "Missing Google Drive file id." },
      { status: 400 },
    );
  }

  try {
    if (!(await canPreviewFile(fileId))) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const preview = await getGoogleDrivePreviewImage(fileId);

    return new NextResponse(new Uint8Array(preview.bytes), {
      headers: {
        "Cache-Control": "public, max-age=3600",
        "Content-Disposition": `inline; filename="${preview.fileName.replaceAll('"', "")}"`,
        "Content-Type": preview.contentType,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to load media thumbnail." },
      { status: 500 },
    );
  }
}
