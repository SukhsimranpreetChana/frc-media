import { NextResponse } from "next/server";
import { completeGoogleDriveResumableUpload } from "@/lib/googleDrive";
import { createMediaClip } from "@/lib/supabase";

export const runtime = "nodejs";

const maxUploadedByLength = 80;
const maxTitleLength = 120;

function isValidTeamNumber(teamNumber: string) {
  return /^\d{1,5}$/.test(teamNumber);
}

function isValidYear(year: number) {
  return Number.isInteger(year) && year >= 1992 && year <= 2100;
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as {
    fileId?: unknown;
    teamNumber?: unknown;
    year?: unknown;
    uploadedBy?: unknown;
    title?: unknown;
    uploadGroupId?: unknown;
    fileCount?: unknown;
    uploadFolder?: {
      id?: unknown;
      name?: unknown;
      url?: unknown;
    };
  } | null;
  const fileId = String(payload?.fileId || "").trim();
  const teamNumber = String(payload?.teamNumber || "").trim();
  const year = Number(payload?.year);
  const uploadedBy = String(payload?.uploadedBy || "").trim();
  const title = String(payload?.title || "").trim();
  const uploadGroupId = String(payload?.uploadGroupId || "").trim();
  const fileCount = Number(payload?.fileCount || 1);
  const uploadFolder =
    typeof payload?.uploadFolder?.id === "string" &&
    typeof payload.uploadFolder.name === "string" &&
    typeof payload.uploadFolder.url === "string"
      ? {
          id: payload.uploadFolder.id,
          name: payload.uploadFolder.name,
          url: payload.uploadFolder.url,
        }
      : undefined;

  if (!fileId) {
    return NextResponse.json(
      { error: "Missing uploaded Google Drive file." },
      { status: 400 },
    );
  }

  if (!isValidTeamNumber(teamNumber) || !isValidYear(year)) {
    return NextResponse.json(
      { error: "Please add a valid team number and year." },
      { status: 400 },
    );
  }

  if (!uploadedBy) {
    return NextResponse.json(
      { error: "Please add your name or handle before uploading." },
      { status: 400 },
    );
  }

  if (uploadedBy.length > maxUploadedByLength || title.length > maxTitleLength) {
    return NextResponse.json(
      { error: "Please shorten the upload name or title." },
      { status: 400 },
    );
  }

  try {
    const driveFile = await completeGoogleDriveResumableUpload({
      fileId,
      uploadFolder,
    });
    const defaultTitle = fileCount > 1
      ? `${teamNumber} collage by ${uploadedBy}`
      : `${teamNumber} media by ${uploadedBy}`;
    const clip = await createMediaClip({
      title: title || defaultTitle,
      teamNumber,
      year,
      videoUrl: driveFile.viewUrl,
      thumbnailUrl: driveFile.thumbnailUrl,
      approved: false,
      uploadedBy,
      uploadGroupId: uploadGroupId || undefined,
      driveFolderUrl: driveFile.folderUrl,
    });

    return NextResponse.json({
      ok: true,
      clip,
      driveFile,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to finish Google Drive upload.";

    console.error("Unable to finish Google Drive upload:", message);

    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
