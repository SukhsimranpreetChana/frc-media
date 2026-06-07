export type Clip = {
  id: string;
  title: string;
  type: string;
  year: number;
  creator: string;
  event: string;
  description: string;
};

export type MediaClip = {
  id: string;
  teamNumber: string;
  year: number;
  videoUrl: string;
  thumbnailUrl: string;
  approved: boolean;
  title?: string;
  uploadedBy?: string;
  createdAt?: string;
};

export type MediaClipRecord = {
  id: string;
  team_number: string;
  year: number;
  video_url: string;
  thumbnail_url: string;
  approved: boolean;
  title: string | null;
  uploaded_by: string | null;
  created_at: string;
};

export type MatchVideo = {
  id: string;
  title: string;
  url: string;
  thumbnailUrl: string;
  year: number;
  eventKey: string;
  matchLabel: string;
  source: "youtube";
  popularityScore?: number;
};

export type ExternalMediaItem = {
  id: string;
  title: string;
  url: string;
  thumbnailUrl?: string;
  year?: number;
  source: "tba" | "youtube";
  label: string;
  popularityScore?: number;
};

export type Team = {
  id: string;
  number: string;
  name: string;
  location: string;
  mediaFocus: string;
  driveUrl: string;
  tags: string[];
  description: string;
  logoUrl?: string;
  logoSource?: string;
  hasMedia?: boolean;
};

export type Commission = {
  id: string;
  title: string;
  link: string;
  costRange: string;
};

export type FooterHandle = {
  id: string;
  handle: string;
  link: string;
  profileImageUrl?: string;
};
