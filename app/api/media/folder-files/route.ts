import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/adminAuth";
import { listGoogleDriveFolderFiles } from "@/lib/googleDrive";
import { getMediaClips } from "@/lib/supabase";

export const runtime = "nodejs";

async function canListFolder(folderUrl: string) {
  if (await hasAdminSession()) {
    return true;
  }

  const approvedClips = await getMediaClips({ approved: true });
  return approvedClips.some((clip) => clip.driveFolderUrl === folderUrl);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const folderUrl = searchParams.get("folderUrl");

  if (!folderUrl) {
    return NextResponse.json(
      { error: "Missing Google Drive folder URL." },
      { status: 400 },
    );
  }

  try {
    if (!(await canListFolder(folderUrl))) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const files = await listGoogleDriveFolderFiles(folderUrl);
    return NextResponse.json({ files });
  } catch {
    return NextResponse.json(
      { error: "Unable to load Google Drive folder files." },
      { status: 500 },
    );
  }
}
