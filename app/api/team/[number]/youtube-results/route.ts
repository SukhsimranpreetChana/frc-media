import { NextResponse } from "next/server";
import type { ExternalMediaItem } from "@/types";

type RouteContext = {
  params: Promise<{
    number: string;
  }>;
};

type YouTubeSearchItem = {
  id?: {
    videoId?: string;
  };
  snippet?: {
    title?: string;
    publishedAt?: string;
    thumbnails?: {
      high?: {
        url?: string;
      };
      medium?: {
        url?: string;
      };
      default?: {
        url?: string;
      };
    };
  };
};

type YouTubeSearchResponse = {
  items?: YouTubeSearchItem[];
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

const youtubeApiKey = process.env.YOUTUBE_API_KEY;

function isValidTeamNumber(teamNumber: string) {
  return /^\d{1,5}$/.test(teamNumber);
}

function getPublishedYear(publishedAt?: string) {
  if (!publishedAt) {
    return undefined;
  }

  const year = new Date(publishedAt).getFullYear();
  return Number.isFinite(year) ? year : undefined;
}

async function getYouTubeViewCounts(videoIds: string[]) {
  if (videoIds.length === 0) {
    return new Map<string, number>();
  }

  const params = new URLSearchParams({
    key: youtubeApiKey || "",
    part: "statistics",
    id: videoIds.join(","),
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

  if (!youtubeApiKey) {
    return NextResponse.json({
      configured: false,
      items: [],
    });
  }

  const params = new URLSearchParams({
    key: youtubeApiKey,
    part: "snippet",
    q: `FRC ${teamNumber} FIRST Robotics`,
    type: "video",
    maxResults: "25",
    order: "date",
    videoEmbeddable: "true",
    safeSearch: "moderate",
  });

  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/search?${params.toString()}`,
    {
      next: {
        revalidate: 60 * 60 * 12,
      },
    },
  );

  if (!response.ok) {
    return NextResponse.json({
      configured: true,
      items: [],
    });
  }

  const data = (await response.json()) as YouTubeSearchResponse;
  const searchItems = (data.items || []).filter((item) => item.id?.videoId);
  const viewCounts = await getYouTubeViewCounts(
    searchItems.map((item) => item.id?.videoId || ""),
  );
  const items = searchItems
    .map((item) => {
      const videoId = item.id?.videoId || "";

      return {
        id: videoId,
        title: item.snippet?.title || `FRC ${teamNumber} video`,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        thumbnailUrl:
          item.snippet?.thumbnails?.high?.url ||
          item.snippet?.thumbnails?.medium?.url ||
          item.snippet?.thumbnails?.default?.url,
        year: getPublishedYear(item.snippet?.publishedAt),
        source: "youtube" as const,
        label: "YouTube Result",
        popularityScore: viewCounts.get(videoId) || 0,
      };
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
