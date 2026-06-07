import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { deleteGoogleDriveFileOrFolder } from "@/lib/googleDrive";

export const runtime = "nodejs";

export async function DELETE(request: Request) {
  const unauthorized = await requireAdmin(request);

  if (unauthorized) {
    return unauthorized;
  }

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
  } catch {
    return NextResponse.json(
      { error: "Unable to delete Google Drive folder." },
      { status: 500 },
    );
  }
}
