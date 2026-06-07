import { NextResponse } from "next/server";
import type { MatchVideo } from "@/types";

type RouteContext = {
  params: Promise<{
    number: string;
  }>;
};

type TbaVideo = {
  type: string;
  key: string;
};

type TbaMatch = {
  key: string;
  event_key: string;
  comp_level: string;
  set_number: number;
  match_number: number;
  videos?: TbaVideo[];
};

type YouTubeVideoStatsItem = {
  id: string;
  statistics?: {
    viewCount?: string;
  };
};

type YouTubeVideoStatsResponse = {
  items?: YouTubeVideoStatsItem[];
};

const tbaAuthKey = process.env.TBA_AUTH_KEY;
const youtubeApiKey = process.env.YOUTUBE_API_KEY;
const currentYear = new Date().getFullYear();
const yearsToSearch = Array.from({ length: 5 }, (_, index) => currentYear - index);

function isValidTeamNumber(teamNumber: string) {
  return /^\d{1,5}$/.test(teamNumber);
}

function getMatchLabel(match: TbaMatch) {
  const levelLabels: Record<string, string> = {
    qm: "Qualification",
    ef: "Eighthfinal",
    qf: "Quarterfinal",
    sf: "Semifinal",
    f: "Final",
  };

  const level = levelLabels[match.comp_level] || match.comp_level.toUpperCase();

  if (match.comp_level === "qm") {
    return `${level} ${match.match_number}`;
  }

  return `${level} ${match.set_number} Match ${match.match_number}`;
}

function getYearFromMatchKey(matchKey: string) {
  const year = Number(matchKey.slice(0, 4));
  return Number.isFinite(year) ? year : currentYear;
}

async function getTeamMatchesForYear(teamNumber: string, year: number) {
  const response = await fetch(
    `https://www.thebluealliance.com/api/v3/team/frc${teamNumber}/matches/${year}`,
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

  return (await response.json()) as TbaMatch[];
}

async function getYouTubeViewCounts(videoIds: string[]) {
  if (!youtubeApiKey || videoIds.length === 0) {
    return new Map<string, number>();
  }

  const params = new URLSearchParams({
    key: youtubeApiKey,
    part: "statistics",
    id: videoIds.slice(0, 50).join(","),
  });

  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?${params.toString()}`,
    {
      next: {
        revalidate: 60 * 60 * 12,
      },
    },
  );

  if (!response.ok) {
    return new Map<string, number>();
  }

  const data = (await response.json()) as YouTubeVideoStatsResponse;
  return new Map(
    (data.items || []).map((item) => [
      item.id,
      Number(item.statistics?.viewCount || 0),
    ]),
  );
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
      videos: [],
    });
  }

  const matchesByYear = await Promise.all(
    yearsToSearch.map((year) => getTeamMatchesForYear(teamNumber, year)),
  );

  const seenVideoIds = new Set<string>();
  const videosWithoutPopularity = matchesByYear
    .flat()
    .flatMap((match) =>
      (match.videos || [])
        .filter((video) => video.type === "youtube" && video.key)
        .map((video) => {
          const id = `${match.key}-${video.key}`;
          const year = getYearFromMatchKey(match.key);
          const matchLabel = getMatchLabel(match);

          return {
            id,
            title: `FRC ${teamNumber} ${matchLabel}`,
            url: `https://www.youtube.com/watch?v=${video.key}`,
            thumbnailUrl: `https://img.youtube.com/vi/${video.key}/hqdefault.jpg`,
            year,
            eventKey: match.event_key,
            matchLabel,
            source: "youtube" as const,
            videoId: video.key,
          };
        }),
    )
    .filter((video) => {
      const videoId = video.url;

      if (seenVideoIds.has(videoId)) {
        return false;
      }

      seenVideoIds.add(videoId);
      return true;
    });
  const viewCounts = await getYouTubeViewCounts(
    videosWithoutPopularity.map((video) => video.videoId),
  );
  const videos = videosWithoutPopularity
    .map(({ videoId, ...video }) => ({
      ...video,
      popularityScore: viewCounts.get(videoId) || 0,
    }))
    .sort(
      (a, b) =>
        b.year - a.year ||
        (b.popularityScore || 0) - (a.popularityScore || 0),
    ) satisfies MatchVideo[];

  return NextResponse.json({
    configured: true,
    videos,
  });
}
