import { NextResponse } from "next/server";
import {
  createGoogleDriveResumableUploadSession,
  createGoogleDriveUploadFolderForSubmission,
} from "@/lib/googleDrive";

export const runtime = "nodejs";

const maxFileSizeBytes = 2 * 1024 * 1024 * 1024;
const maxTotalUploadBytes = 2 * 1024 * 1024 * 1024;
const maxUploadedByLength = 80;
const maxTitleLength = 120;

type UploadSessionFile = {
  clientId?: unknown;
  name?: unknown;
  type?: unknown;
  size?: unknown;
};

function isValidTeamNumber(teamNumber: string) {
  return /^\d{1,5}$/.test(teamNumber);
}

function isValidYear(year: number) {
  return Number.isInteger(year) && year >= 1992 && year <= 2100;
}

function isUploadSessionFile(file: UploadSessionFile) {
  return (
    typeof file.clientId === "string" &&
    typeof file.name === "string" &&
    typeof file.type === "string" &&
    typeof file.size === "number"
  );
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as {
    teamNumber?: unknown;
    year?: unknown;
    uploadedBy?: unknown;
    title?: unknown;
    files?: UploadSessionFile[];
  } | null;
  const teamNumber = String(payload?.teamNumber || "").trim();
  const year = Number(payload?.year);
  const uploadedBy = String(payload?.uploadedBy || "").trim();
  const title = String(payload?.title || "").trim();
  const files = Array.isArray(payload?.files) ? payload.files : [];
  const totalUploadBytes = files.reduce(
    (total, file) => total + (typeof file.size === "number" ? file.size : 0),
    0,
  );

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

  if (files.length === 0 || !files.every(isUploadSessionFile)) {
    return NextResponse.json(
      { error: "Please choose at least one file to upload." },
      { status: 400 },
    );
  }

  if (
    files.some(
      (file) =>
        typeof file.size !== "number" ||
        file.size <= 0 ||
        file.size > maxFileSizeBytes ||
        (typeof file.type === "string" &&
          !file.type.startsWith("video/") &&
          !file.type.startsWith("image/")),
    ) ||
    totalUploadBytes > maxTotalUploadBytes
  ) {
    return NextResponse.json(
      { error: "Uploads can be up to 2 GB total, with only image or video files." },
      { status: 400 },
    );
  }

  try {
    const uploadFolder = await createGoogleDriveUploadFolderForSubmission({
      teamNumber,
      year,
      uploadedBy,
    });
    const sessions = await Promise.all(
      files.map(async (file) => {
        const session = await createGoogleDriveResumableUploadSession({
          fileName: String(file.name),
          mimeType: String(file.type),
          size: Number(file.size),
          uploadFolder,
        });

        return {
          clientId: file.clientId,
          ...session,
        };
      }),
    );

    return NextResponse.json({
      uploadGroupId: crypto.randomUUID(),
      uploadFolder,
      sessions,
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to start Google Drive upload." },
      { status: 500 },
    );
  }
}
