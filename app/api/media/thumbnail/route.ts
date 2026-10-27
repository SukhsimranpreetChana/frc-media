import { NextResponse } from "next/server";
import {
  getGoogleDriveFileIdFromUrl,
  getGoogleDrivePreviewImage,
} from "@/lib/googleDrive";
import { canViewDriveFile } from "@/lib/mediaAccess";

export const runtime = "nodejs";

// Only a few sizes, so the cache is shared and nobody can request huge originals.
const allowedPreviewSizes = [400, 2048];

function getPreviewSize(value: string | null) {
  const size = Number(value);

  return allowedPreviewSizes.includes(size) ? size : undefined;
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
    if (!(await canViewDriveFile(fileId))) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const preview = await getGoogleDrivePreviewImage(
      fileId,
      getPreviewSize(searchParams.get("size")),
    );

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
