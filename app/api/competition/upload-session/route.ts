import { NextResponse } from "next/server";
import { requireSameOrigin } from "@/lib/adminAuth";
import { checkRateLimit } from "@/lib/rateLimit";
import {
  createGoogleDriveResumableUploadSession,
  createGoogleDriveUploadFolderForCompetition,
} from "@/lib/googleDrive";
import {
  currentCompetitionNumber,
  isCurrentCompetitionOpen,
} from "@/lib/competition";
import { hasCompetitionSubmissionForHandle } from "@/lib/supabase";

export const runtime = "nodejs";

const maxFileSizeBytes = 10 * 1024 * 1024 * 1024;
const maxHandleLength = 80;

type UploadSessionFile = {
  clientId?: unknown;
  name?: unknown;
  type?: unknown;
  size?: unknown;
};

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

function isUploadSessionFile(file: UploadSessionFile): file is {
  clientId: string;
  name: string;
  type: string;
  size: number;
} {
  return (
    typeof file.clientId === "string" &&
    typeof file.name === "string" &&
    typeof file.type === "string" &&
    typeof file.size === "number"
  );
}

export async function POST(request: Request) {
  const forbidden = requireSameOrigin(request);

  if (forbidden) {
    return forbidden;
  }

  const rateLimit = checkRateLimit(request, {
    scope: "competition-upload-session",
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many upload attempts. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      },
    );
  }

  if (!isCurrentCompetitionOpen()) {
    return NextResponse.json(
      { error: "Competition submissions are closed." },
      { status: 403 },
    );
  }

  const payload = (await request.json().catch(() => null)) as {
    handle?: unknown;
    submissionLink?: unknown;
    file?: UploadSessionFile;
  } | null;
  const handle = normalizeHandle(String(payload?.handle || ""));
  const submissionLink = String(payload?.submissionLink || "").trim();
  const file = payload?.file;

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

  if (!file || !isUploadSessionFile(file)) {
    return NextResponse.json(
      { error: "Please choose one video file to upload." },
      { status: 400 },
    );
  }

  if (
    file.size <= 0 ||
    file.size > maxFileSizeBytes ||
    !String(file.type).startsWith("video/")
  ) {
    return NextResponse.json(
      { error: "Contest uploads must be one video file up to 10 GB." },
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

    const uploadFolder = await createGoogleDriveUploadFolderForCompetition({
      competitionNumber: currentCompetitionNumber,
      handle,
    });
    const session = await createGoogleDriveResumableUploadSession({
      fileName: String(file.name),
      mimeType: String(file.type),
      size: Number(file.size),
      uploadFolder,
    });

    return NextResponse.json({
      competitionNumber: currentCompetitionNumber,
      uploadFolder,
      session: {
        clientId: file.clientId,
        ...session,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to start competition upload.";

    console.error("Unable to start competition upload session:", message);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
