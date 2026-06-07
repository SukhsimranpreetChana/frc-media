import { NextResponse } from "next/server";
import { getGoogleDriveParentFolderUrl } from "@/lib/googleDrive";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const payload = (await request.json()) as {
    fileUrl?: string;
  };
  const fileUrl = payload.fileUrl?.trim();

  if (!fileUrl) {
    return NextResponse.json(
      { error: "Missing Google Drive file URL." },
      { status: 400 },
    );
  }

  try {
    return NextResponse.json({
      folderUrl: await getGoogleDriveParentFolderUrl(fileUrl),
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to resolve Google Drive folder.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
