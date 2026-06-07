import { NextResponse } from "next/server";
import type { ExternalMediaItem } from "@/types";

type RouteContext = {
  params: Promise<{
    number: string;
  }>;
};

type TbaMedia = {
  type: string;
  foreign_key: string;
  preferred?: boolean;
  details?: {
    base64Image?: string;
  };
};

const tbaAuthKey = process.env.TBA_AUTH_KEY;
const currentYear = new Date().getFullYear();
const yearsToSearch = Array.from({ length: 5 }, (_, index) => currentYear - index);

function isValidTeamNumber(teamNumber: string) {
  return /^\d{1,5}$/.test(teamNumber);
}

function getTbaMediaUrl(media: TbaMedia, teamNumber: string) {
  if (media.type === "imgur") {
    return `https://imgur.com/${media.foreign_key}`;
  }

  if (media.type === "cdphotothread" && media.foreign_key.startsWith("http")) {
    return media.foreign_key;
  }

  return `https://www.thebluealliance.com/team/${teamNumber}`;
}

function getTbaThumbnailUrl(media: TbaMedia) {
  if (media.type === "imgur") {
    return `https://i.imgur.com/${media.foreign_key}h.jpg`;
  }

  if (media.type === "avatar" && media.details?.base64Image) {
    return `data:image/png;base64,${media.details.base64Image}`;
  }

  if (media.foreign_key.startsWith("http")) {
    return media.foreign_key;
  }

  return undefined;
}

async function getTeamMediaForYear(teamNumber: string, year: number) {
  const response = await fetch(
    `https://www.thebluealliance.com/api/v3/team/frc${teamNumber}/media/${year}`,
    {
      headers: {
        "X-TBA-Auth-Key": tbaAuthKey || "",
      },
      next: {
        revalidate: 60 * 60 * 12,
      },
    },
  );

  if (!response.ok) {
    return [];
  }

  return (await response.json()) as TbaMedia[];
}

export async function GET(_request: Request, context: RouteContext) {
  const { number } = await context.params;
  const teamNumber = number.trim();

  if (!isValidTeamNumber(teamNumber)) {
    return NextResponse.json(
      { error: "Invalid team number." },
      { status: 400 },
    );
  }

  if (!tbaAuthKey) {
    return NextResponse.json({
      configured: false,
      items: [],
    });
  }

  const mediaByYear = await Promise.all(
    yearsToSearch.map((year) => getTeamMediaForYear(teamNumber, year)),
  );

  const seen = new Set<string>();
  const items = mediaByYear
    .flatMap((media, yearIndex) =>
      media
        .filter((item) => item.type !== "youtube" && item.foreign_key)
        .map((item) => {
          const year = yearsToSearch[yearIndex];
          const url = getTbaMediaUrl(item, teamNumber);

          return {
            id: `${year}-${item.type}-${item.foreign_key}`,
            title: `FRC ${teamNumber} ${item.type.replaceAll("_", " ")}`,
            url,
            thumbnailUrl: getTbaThumbnailUrl(item),
            year,
            source: "tba" as const,
            label: item.preferred ? "TBA Preferred" : "TBA Media",
            popularityScore: item.preferred ? 1 : 0,
          };
        }),
    )
    .filter((item) => {
      const key = `${item.url}-${item.thumbnailUrl || ""}`;

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    })
    .sort(
      (a, b) =>
        (b.year || 0) - (a.year || 0) ||
        (b.popularityScore || 0) - (a.popularityScore || 0),
    ) satisfies ExternalMediaItem[];

  return NextResponse.json({
    configured: true,
    items,
  });
}
