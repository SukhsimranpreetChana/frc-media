import { NextResponse } from "next/server";
import {
  createGoogleDriveUploadFolderForSubmission,
  uploadMediaToGoogleDrive,
} from "@/lib/googleDrive";
import { createMediaClip } from "@/lib/supabase";

export const runtime = "nodejs";

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
  const uploaderName = uploadedBy || "Unknown uploader";
  const uploadGroupId = crypto.randomUUID();

  if (files.length === 0) {
    return NextResponse.json(
      { error: "Please choose at least one file to upload." },
      { status: 400 },
    );
  }

  if (!isValidTeamNumber(teamNumber) || !isValidYear(year)) {
    return NextResponse.json(
      { error: "Please add a valid team number and year." },
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
    const collageTitle = `${teamNumber} collage by ${uploaderName}`;
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
        title: title || collageTitle,
        teamNumber,
        year,
        videoUrl: driveFile.viewUrl,
        thumbnailUrl: driveFile.thumbnailUrl,
        approved: false,
        uploadedBy: uploadedBy || undefined,
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
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to upload media to Google Drive.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
