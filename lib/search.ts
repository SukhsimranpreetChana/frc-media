import type { Clip, Team } from "@/types";
import { mediaDriveUrl } from "@/lib/drive";

export const featuredClips: Clip[] = [
  {
    id: "event-recap",
    title: "Regional recap package",
    type: "Video",
    year: 2026,
    creator: "FIRST Media Community",
    event: "Example regional",
    description:
      "A placeholder clip for future recap videos, highlight reels, and event coverage.",
  },
  {
    id: "pit-photo-set",
    title: "Pit and robot photo set",
    type: "Photography",
    year: 2026,
    creator: "Community contributors",
    event: "Example event",
    description:
      "A placeholder gallery entry for photos shared through the media drive.",
  },
  {
    id: "social-template",
    title: "Team social graphics",
    type: "Graphic design",
    year: 2026,
    creator: "Design mentors",
    event: "Offseason",
    description:
      "A placeholder resource for editable posts, banners, and team graphics.",
  },
];

export const featuredTeams: Team[] = [
  {
    id: "community-team",
    number: "0000",
    name: "Community Contributors",
    location: "Online",
    mediaFocus: "Photography, video, design",
    driveUrl: mediaDriveUrl,
    tags: ["clips", "photos", "video", "graphics", "community"],
    description:
      "A starter profile for students, alumni, and mentors contributing media to the community.",
  },
  {
    id: "event-crew",
    number: "9999",
    name: "Event Media Crew",
    location: "Regional events",
    mediaFocus: "Event coverage",
    driveUrl: mediaDriveUrl,
    tags: ["clips", "event coverage", "recaps", "regional"],
    description:
      "A placeholder team profile for groups available to help capture and publish event media.",
  },
];

export function searchClips(query: string, clips: Clip[] = featuredClips) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return clips;
  }

  return clips.filter((clip) =>
    [clip.title, clip.type, clip.creator, clip.event, clip.description]
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery),
  );
}

export function searchTeams(query: string, teams: Team[] = featuredTeams) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return teams;
  }

  return teams.filter((team) =>
    [
      team.number,
      team.name,
      team.location,
      team.mediaFocus,
      team.description,
      team.tags.join(" "),
    ]
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery),
  );
}
