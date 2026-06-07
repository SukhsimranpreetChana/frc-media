import { NextResponse } from "next/server";
import { listGoogleDriveFolderFiles } from "@/lib/googleDrive";

export const runtime = "nodejs";

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
    const files = await listGoogleDriveFolderFiles(folderUrl);
    return NextResponse.json({ files });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to load Google Drive folder files.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
