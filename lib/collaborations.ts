// Collabs shown on the Commissions page. To add one, add an entry here:
// `id` is the YouTube video id or the Instagram post id from the link.
// YouTube thumbnails load automatically. Instagram has no public thumbnail
// link, so give Instagram posts an `image` (a file in public/, e.g.
// "/media/collabs/9068-robot-reveal.jpg"); without one the card shows a
// placeholder.
export type Collaboration = {
  platform: "youtube" | "instagram";
  id: string;
  title: string;
  url: string;
  image?: string;
};

export const collaborations: Collaboration[] = [
  {
    platform: "youtube",
    id: "rtmpjWaiFHY",
    title: "The Rebuilt Recap",
    url: "https://www.youtube.com/watch?v=rtmpjWaiFHY",
  },
  {
    platform: "youtube",
    id: "tCHCyic7X9Q",
    title: "The Reefscape Recap",
    url: "https://www.youtube.com/watch?v=tCHCyic7X9Q&t=1s",
  },
  {
    platform: "youtube",
    id: "aDsBINcdTII",
    title: "2056 2026 Recap Video",
    url: "https://www.youtube.com/watch?v=aDsBINcdTII&t=17s",
  },
  {
    platform: "youtube",
    id: "rv4fBS_B19M",
    title: "3255 Ping Pong Showdown Game Reveal",
    url: "https://www.youtube.com/watch?v=rv4fBS_B19M",
  },
  {
    platform: "youtube",
    id: "vTMTDu5gPL0",
    title: "1678 Citrus Circuits Official Mod",
    url: "https://www.youtube.com/watch?v=vTMTDu5gPL0",
  },
  {
    platform: "youtube",
    id: "IikP-Chz-Mo",
    title: "2056 OP Robotics Official Mod",
    url: "https://www.youtube.com/watch?v=IikP-Chz-Mo",
  },
  {
    platform: "instagram",
    id: "Ddy-5BcByVZ",
    title: "Pedro Pathing 2026 Recap",
    url: "https://www.instagram.com/p/Ddy-5BcByVZ/",
  },
  {
    platform: "instagram",
    id: "DenLSaphE44",
    title: "REBUILD Simulator | Daly Alliance x 2056 V1",
    url: "https://www.instagram.com/p/DenLSaphE44/",
  },
  {
    platform: "instagram",
    id: "DeRrLw1nGPl",
    title: "9068 Robot Reveal",
    url: "https://www.instagram.com/p/DeRrLw1nGPl/",
  },
  {
    platform: "youtube",
    id: "9VpVZiApRFw",
    title: "Team 4414 Robot Reveal",
    url: "https://www.youtube.com/watch?v=9VpVZiApRFw",
  },
  {
    platform: "youtube",
    id: "s2KrL7Xyh28",
    title: "BORDERLINE Collab",
    url: "https://www.youtube.com/watch?v=s2KrL7Xyh28",
  },
  {
    platform: "youtube",
    id: "l3kjl2T_tg0",
    title: "KILL Collab",
    url: "https://www.youtube.com/watch?v=l3kjl2T_tg0",
  },
];

export function getCollaborationThumbnail(collaboration: Collaboration) {
  if (collaboration.image) {
    return collaboration.image;
  }

  return collaboration.platform === "youtube"
    ? `https://img.youtube.com/vi/${collaboration.id}/hqdefault.jpg`
    : null;
}
