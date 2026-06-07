import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/adminAuth";
import { getGoogleDriveParentFolderUrl } from "@/lib/googleDrive";
import { getMediaClips } from "@/lib/supabase";

export const runtime = "nodejs";

async function canResolveFileUrl(fileUrl: string) {
  if (await hasAdminSession()) {
    return true;
  }

  const approvedClips = await getMediaClips({ approved: true });
  return approvedClips.some((clip) => clip.videoUrl === fileUrl);
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as {
    fileUrl?: string;
  } | null;
  const fileUrl = payload?.fileUrl?.trim();

  if (!fileUrl) {
    return NextResponse.json(
      { error: "Missing Google Drive file URL." },
      { status: 400 },
    );
  }

  try {
    if (!(await canResolveFileUrl(fileUrl))) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    return NextResponse.json({
      folderUrl: await getGoogleDriveParentFolderUrl(fileUrl),
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to resolve Google Drive folder." },
      { status: 500 },
    );
  }
}
