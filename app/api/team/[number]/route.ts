import { NextResponse } from "next/server";
import { mediaDriveUrl } from "@/lib/drive";
import type { Team } from "@/types";

type StatboticsTeam = {
  team: number;
  name?: string;
  country?: string;
  state?: string;
  district?: string | null;
  rookie_year?: number;
  active?: boolean;
};

type TbaMedia = {
  type: string;
  foreign_key: string;
  details?: {
    base64Image?: string;
  };
};

type RouteContext = {
  params: Promise<{
    number: string;
  }>;
};

const tbaAuthKey = process.env.TBA_AUTH_KEY;
const currentYear = new Date().getFullYear();
const yearsToSearch = Array.from({ length: 5 }, (_, index) => currentYear - index);

function isValidTeamNumber(teamNumber: string) {
  return /^\d{1,5}$/.test(teamNumber);
}

function getLocation(team: StatboticsTeam) {
  return [team.state, team.country].filter(Boolean).join(", ") || "Unknown";
}

async function getStatboticsTeam(teamNumber: string) {
  const response = await fetch(
    `https://api.statbotics.io/v3/team/${teamNumber}`,
    {
      next: {
        revalidate: 60 * 60 * 24,
      },
    },
  );

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as StatboticsTeam;
}

async function getTbaMediaForYear(teamNumber: string, year: number) {
  if (!tbaAuthKey) {
    return [];
  }

  const response = await fetch(
    `https://www.thebluealliance.com/api/v3/team/frc${teamNumber}/media/${year}`,
    {
      headers: {
        "X-TBA-Auth-Key": tbaAuthKey,
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

async function getTbaLogoUrl(teamNumber: string) {
  const mediaByYear = await Promise.all(
    yearsToSearch.map((year) => getTbaMediaForYear(teamNumber, year)),
  );

  const avatar = mediaByYear
    .flat()
    .find((media) => media.type === "avatar" && media.details?.base64Image);

  if (!avatar?.details?.base64Image) {
    return undefined;
  }

  return `data:image/png;base64,${avatar.details.base64Image}`;
}

async function getLogoUrl(teamNumber: string) {
  const tbaLogoUrl = await getTbaLogoUrl(teamNumber);

  if (tbaLogoUrl) {
    return {
      url: tbaLogoUrl,
      source: "The Blue Alliance",
    };
  }

  const response = await fetch("https://logos.frc.sh/", {
    next: {
      revalidate: 60 * 60 * 24,
    },
  });

  if (!response.ok) {
    return undefined;
  }

  const html = await response.text();
  const pattern = new RegExp(
    `<img[^>]+(?:alt=["']Team ${teamNumber}["'][^>]+src=["']([^"']+)["']|src=["']([^"']+)["'][^>]+alt=["']Team ${teamNumber}["'])`,
    "i",
  );
  const match = html.match(pattern);
  const src = match?.[1] || match?.[2];

  if (!src) {
    return undefined;
  }

  return {
    url: new URL(src, "https://logos.frc.sh/").toString(),
    source: "logos.frc.sh",
  };
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

  const team = await getStatboticsTeam(teamNumber);

  if (!team) {
    return NextResponse.json({ error: "Team not found." }, { status: 404 });
  }

  const logo = await getLogoUrl(teamNumber);
  const responseTeam: Team = {
    id: `frc-${teamNumber}`,
    number: teamNumber,
    name: team.name || `Team ${teamNumber}`,
    location: getLocation(team),
    mediaFocus: "No FMC media posted yet",
    driveUrl: mediaDriveUrl,
    tags: ["api", "statbotics", "team"],
    description:
      team.rookie_year && team.active !== false
        ? `Active FRC team since ${team.rookie_year}.`
        : "FRC team profile.",
    logoUrl: logo?.url,
    logoSource: logo?.source,
    hasMedia: false,
  };

  return NextResponse.json(responseTeam);
}
