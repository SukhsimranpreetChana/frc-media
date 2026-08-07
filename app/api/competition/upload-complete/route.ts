import { NextResponse } from "next/server";
import { completeGoogleDriveResumableUpload } from "@/lib/googleDrive";
import {
  currentCompetitionNumber,
  isCurrentCompetitionOpen,
} from "@/lib/competition";
import {
  createCompetitionSubmission,
  hasCompetitionSubmissionForHandle,
} from "@/lib/supabase";

export const runtime = "nodejs";

const maxHandleLength = 80;

function normalizeHandle(handle: string) {
  return handle.trim().replace(/\s+/g, " ");
}

function isValidUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!isCurrentCompetitionOpen()) {
    return NextResponse.json(
      { error: "Competition submissions are closed." },
      { status: 403 },
    );
  }

  const payload = (await request.json().catch(() => null)) as {
    fileId?: unknown;
    fileName?: unknown;
    handle?: unknown;
    submissionLink?: unknown;
    uploadFolder?: {
      id?: unknown;
      name?: unknown;
      url?: unknown;
    };
  } | null;
  const fileId = String(payload?.fileId || "").trim();
  const fileName = String(payload?.fileName || "").trim();
  const handle = normalizeHandle(String(payload?.handle || ""));
  const submissionLink = String(payload?.submissionLink || "").trim();
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

  if (!fileId && !fileName) {
    return NextResponse.json(
      { error: "Missing uploaded Google Drive file." },
      { status: 400 },
    );
  }

  if (!handle || handle.length > maxHandleLength) {
    return NextResponse.json(
      { error: "Please add a shorter handle before submitting." },
      { status: 400 },
    );
  }

  if (!isValidUrl(submissionLink)) {
    return NextResponse.json(
      { error: "Please add a valid public submission link." },
      { status: 400 },
    );
  }

  try {
    const alreadySubmitted = await hasCompetitionSubmissionForHandle({
      competitionNumber: currentCompetitionNumber,
      handle,
    });

    if (alreadySubmitted) {
      return NextResponse.json(
        { error: "This handle already has a submission for Competition 1." },
        { status: 409 },
      );
    }

    const driveFile = await completeGoogleDriveResumableUpload({
      fileId: fileId || undefined,
      fileName: fileName || undefined,
      uploadFolder,
    });
    const submission = await createCompetitionSubmission({
      competitionNumber: currentCompetitionNumber,
      handle,
      submissionLink,
      fileUrl: driveFile.viewUrl,
      thumbnailUrl: driveFile.thumbnailUrl,
      driveFolderUrl: driveFile.folderUrl,
    });

    return NextResponse.json({
      ok: true,
      submission,
      driveFile,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to finish competition upload.";

    console.error("Unable to finish competition upload:", message);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
