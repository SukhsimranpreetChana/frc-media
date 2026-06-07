import { NextResponse } from "next/server";
import {
  createGoogleDriveUploadFolderForSubmission,
  uploadMediaToGoogleDrive,
} from "@/lib/googleDrive";
import { createMediaClip } from "@/lib/supabase";

export const runtime = "nodejs";

const maxFileCount = 6;
const maxFileSizeBytes = 100 * 1024 * 1024;
const maxTotalUploadBytes = 250 * 1024 * 1024;
const maxUploadedByLength = 80;
const maxTitleLength = 120;

function isValidTeamNumber(teamNumber: string) {
  return /^\d{1,5}$/.test(teamNumber);
}

function isValidYear(year: number) {
  return Number.isInteger(year) && year >= 1992 && year <= 2100;
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const files = formData.getAll("files").filter((file) => file instanceof File);
  const teamNumber = String(formData.get("teamNumber") || "").trim();
  const year = Number(formData.get("year"));
  const uploadedBy = String(formData.get("uploadedBy") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const uploadGroupId = crypto.randomUUID();
  const totalUploadBytes = files.reduce((total, file) => total + file.size, 0);

  if (files.length === 0) {
    return NextResponse.json(
      { error: "Please choose at least one file to upload." },
      { status: 400 },
    );
  }

  if (files.length > maxFileCount) {
    return NextResponse.json(
      { error: `Please upload ${maxFileCount} files or fewer at a time.` },
      { status: 400 },
    );
  }

  if (
    files.some((file) => file.size <= 0 || file.size > maxFileSizeBytes) ||
    totalUploadBytes > maxTotalUploadBytes
  ) {
    return NextResponse.json(
      { error: "One or more files are too large for this upload." },
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

  if (
    files.some(
      (file) => !file.type.startsWith("video/") && !file.type.startsWith("image/"),
    )
  ) {
    return NextResponse.json(
      { error: "Please upload only image or video files." },
      { status: 400 },
    );
  }

  try {
    const uploads = [];
    const defaultTitle =
      files.length > 1
        ? `${teamNumber} collage by ${uploadedBy}`
        : `${teamNumber} media by ${uploadedBy}`;
    const uploadFolder = await createGoogleDriveUploadFolderForSubmission({
      teamNumber,
      year,
      uploadedBy,
    });

    for (const file of files) {
      const driveFile = await uploadMediaToGoogleDrive({
        file,
        teamNumber,
        year,
        uploadedBy,
        uploadFolder,
      });
      const clip = await createMediaClip({
        title: title || defaultTitle,
        teamNumber,
        year,
        videoUrl: driveFile.viewUrl,
        thumbnailUrl: driveFile.thumbnailUrl,
        approved: false,
        uploadedBy,
        uploadGroupId,
        driveFolderUrl: driveFile.folderUrl,
      });

      uploads.push({
        clip,
        driveFile,
      });
    }

    return NextResponse.json({
      ok: true,
      uploads,
      uploadGroupId,
      driveFolderUrl: uploadFolder.url,
      driveFolderName: uploadFolder.name,
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to upload media to Google Drive." },
      { status: 500 },
    );
  }
}
