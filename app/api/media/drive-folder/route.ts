import { NextResponse } from "next/server";
import { deleteGoogleDriveFileOrFolder } from "@/lib/googleDrive";

export const runtime = "nodejs";

export async function DELETE(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    folderUrl?: string;
  } | null;
  const folderUrl = body?.folderUrl?.trim();

  if (!folderUrl) {
    return NextResponse.json(
      { error: "Missing Google Drive folder URL." },
      { status: 400 },
    );
  }

  try {
    await deleteGoogleDriveFileOrFolder(folderUrl);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to delete Google Drive folder.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
