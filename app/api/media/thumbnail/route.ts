import { NextResponse } from "next/server";
import {
  getGoogleDriveFileIdFromUrl,
  getGoogleDrivePreviewImage,
} from "@/lib/googleDrive";

export const runtime = "nodejs";

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
    const preview = await getGoogleDrivePreviewImage(fileId);

    return new NextResponse(new Uint8Array(preview.bytes), {
      headers: {
        "Cache-Control": "public, max-age=3600",
        "Content-Disposition": `inline; filename="${preview.fileName.replaceAll('"', "")}"`,
        "Content-Type": preview.contentType,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load media thumbnail.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
