import { NextResponse } from "next/server";
import { getRecentUploadCollages } from "@/lib/recentUploads";

const defaultLimit = 9;
const maxLimit = 24;

function getSafeNumber(value: string | null, fallback: number) {
  const number = Number(value);

  return Number.isFinite(number) && number >= 0 ? Math.floor(number) : fallback;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const offset = getSafeNumber(url.searchParams.get("offset"), 0);
  const requestedLimit = getSafeNumber(
    url.searchParams.get("limit"),
    defaultLimit,
  );
  const limit = Math.min(maxLimit, Math.max(1, requestedLimit));
  const recentUploads = await getRecentUploadCollages({ limit, offset });

  return NextResponse.json(recentUploads);
}
