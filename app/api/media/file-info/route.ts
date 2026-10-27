import { NextResponse } from "next/server";
import { getGoogleDriveFileInfo } from "@/lib/googleDrive";
import { canViewDriveFile } from "@/lib/mediaAccess";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const fileId = new URL(request.url).searchParams.get("fileId");

  if (!fileId) {
    return NextResponse.json(
      { error: "Missing Google Drive file id." },
      { status: 400 },
    );
  }

  try {
    if (!(await canViewDriveFile(fileId))) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const info = await getGoogleDriveFileInfo(fileId);

    return NextResponse.json(
      { info },
      { headers: { "Cache-Control": "public, max-age=3600" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Unable to load media details." },
      { status: 500 },
    );
  }
}
