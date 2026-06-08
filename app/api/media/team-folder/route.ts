import { NextResponse } from "next/server";
import { getGoogleDriveParentFolderUrl } from "@/lib/googleDrive";
import { getMediaClips } from "@/lib/supabase";

export const runtime = "nodejs";

function isValidTeamNumber(teamNumber: string) {
  return /^\d{1,5}$/.test(teamNumber);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const teamNumber = (searchParams.get("teamNumber") || "").trim();

  if (!isValidTeamNumber(teamNumber)) {
    return NextResponse.json(
      { error: "Invalid team number." },
      { status: 400 },
    );
  }

  try {
    const clips = await getMediaClips({ teamNumber, approved: true });
    const newestClipWithFolder = clips.find((clip) => clip.driveFolderUrl);

    if (newestClipWithFolder?.driveFolderUrl) {
      return NextResponse.json({
        hasFolder: true,
        folderUrl: newestClipWithFolder.driveFolderUrl,
        year: newestClipWithFolder.year,
      });
    }

    const newestClip = clips[0];

    if (newestClip?.videoUrl) {
      const folderUrl = await getGoogleDriveParentFolderUrl(newestClip.videoUrl);

      return NextResponse.json({
        hasFolder: true,
        folderUrl,
        year: newestClip.year,
      });
    }

    return NextResponse.json({
      hasFolder: false,
      uploadUrl: "/upload#upload-media",
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to load Google Drive team folder.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
