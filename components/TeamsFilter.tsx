"use client";

import { useEffect, useMemo, useState } from "react";
import ExternalMediaCard from "@/components/ExternalMediaCard";
import MatchVideoCard from "@/components/MatchVideoCard";
import MediaCollageCard, {
  getCollageCoverClip,
  type MediaCollage,
} from "@/components/MediaCollageCard";
import TeamCard from "@/components/TeamCard";
import { getMediaClips } from "@/lib/supabase";
import { searchTeams } from "@/lib/search";
import type { ExternalMediaItem, MatchVideo, MediaClip, Team } from "@/types";

type TeamsFilterProps = {
  initialTeamNumber?: string;
  teams: Team[];
};

const uploadLink = "/upload#upload-media";

type MatchVideosResponse = {
  configured: boolean;
  videos: MatchVideo[];
};

type ExternalMediaResponse = {
  configured: boolean;
  items: ExternalMediaItem[];
};

const randomTeamPool = [
  "1114",
  "118",
  "148",
  "1678",
  "2056",
  "254",
  "2910",
  "4414",
  "4481",
  "6328",
  "694",
  "971",
];

function pickRandomTeams() {
  return [...randomTeamPool].sort(() => Math.random() - 0.5).slice(0, 3);
}

const mediaPageSize = 6;

function getCreatedTime(clip: MediaClip) {
  return clip.createdAt ? new Date(clip.createdAt).getTime() : 0;
}

function sortMediaClips(clips: MediaClip[]) {
  return [...clips].sort(
    (a, b) => b.year - a.year || getCreatedTime(b) - getCreatedTime(a),
  );
}

function getMediaCollages(clips: MediaClip[]) {
  const groups = new Map<string, MediaCollage>();

  sortMediaClips(clips).forEach((clip) => {
    const uploadedBy = clip.uploadedBy || "Unknown uploader";
    // Files from the same upload should show as a group instead of separate posts.
    const groupId =
      clip.uploadGroupId ||
      clip.driveFolderUrl ||
      `${clip.teamNumber}-${clip.year}-${uploadedBy}`;
    const existingGroup = groups.get(groupId);

    if (existingGroup) {
      existingGroup.clips.push(clip);
      existingGroup.folderUrl = existingGroup.folderUrl || clip.driveFolderUrl;
      return;
    }

    groups.set(groupId, {
      id: groupId,
      title: clip.title || `${clip.teamNumber} media by ${uploadedBy}`,
      clips: [clip],
      folderUrl: clip.driveFolderUrl,
      teamNumber: clip.teamNumber,
      year: clip.year,
    });
  });

  return Array.from(groups.values()).sort((a, b) => {
    const aCover = getCollageCoverClip(a);
    const bCover = getCollageCoverClip(b);

    return (
      b.year - a.year ||
      getCreatedTime(bCover) - getCreatedTime(aCover)
    );
  });
}

function sortExternalMedia(items: ExternalMediaItem[]) {
  return [...items].sort(
    (a, b) =>
      (b.year || 0) - (a.year || 0) ||
      (b.popularityScore || 0) - (a.popularityScore || 0),
  );
}

function sortMatchVideos(videos: MatchVideo[]) {
  return [...videos].sort(
    (a, b) =>
      b.year - a.year ||
      (b.popularityScore || 0) - (a.popularityScore || 0),
  );
}

function paginateItems<T>(items: T[], page: number) {
  return items.slice((page - 1) * mediaPageSize, page * mediaPageSize);
}

function getPageCount(totalItems: number) {
  return Math.max(1, Math.ceil(totalItems / mediaPageSize));
}

function getDigitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

type PaginationControlsProps = {
  currentPage: number;
  itemCount: number;
  label: string;
  onPageChange: (page: number) => void;
};

function PaginationControls({
  currentPage,
  itemCount,
  label,
  onPageChange,
}: PaginationControlsProps) {
  const pageCount = getPageCount(itemCount);

  if (pageCount <= 1) {
    return null;
  }

  return (
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-[#17001C]/65">
        Page {currentPage} of {pageCount} for {label}
      </p>
      <div className="flex gap-3">
        <button
          className="font-primary fmc-button h-10 bg-[#17001C] px-4 text-sm text-white hover:bg-[#72007E] disabled:opacity-45"
          disabled={currentPage === 1}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          type="button"
        >
          Previous
        </button>
        <button
          className="font-primary fmc-button h-10 bg-[#7137E3] px-4 text-sm text-white hover:bg-[#A335E6] disabled:opacity-45"
          disabled={currentPage === pageCount}
          onClick={() => onPageChange(Math.min(pageCount, currentPage + 1))}
          type="button"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default function TeamsFilter({
  initialTeamNumber = "",
  teams,
}: TeamsFilterProps) {
  const [query, setQuery] = useState(getDigitsOnly(initialTeamNumber));
  const [yearFilter, setYearFilter] = useState("");
  const [remoteTeam, setRemoteTeam] = useState<Team | null>(null);
  const [isLoadingTeam, setIsLoadingTeam] = useState(false);
  const [previewTeams, setPreviewTeams] = useState<Team[]>([]);
  const [isLoadingPreviewTeams, setIsLoadingPreviewTeams] = useState(true);
  const [teamClips, setTeamClips] = useState<MediaClip[]>([]);
  const [isLoadingClips, setIsLoadingClips] = useState(false);
  const [matchVideos, setMatchVideos] = useState<MatchVideo[]>([]);
  const [isLoadingMatchVideos, setIsLoadingMatchVideos] = useState(false);
  const [matchVideosConfigured, setMatchVideosConfigured] = useState(true);
  const [tbaMedia, setTbaMedia] = useState<ExternalMediaItem[]>([]);
  const [isLoadingTbaMedia, setIsLoadingTbaMedia] = useState(false);
  const [tbaMediaConfigured, setTbaMediaConfigured] = useState(true);
  const [youtubeResults, setYoutubeResults] = useState<ExternalMediaItem[]>([]);
  const [isLoadingYoutubeResults, setIsLoadingYoutubeResults] = useState(false);
  const [youtubeResultsConfigured, setYoutubeResultsConfigured] = useState(true);
  const [fmcPage, setFmcPage] = useState(1);
  const [tbaPage, setTbaPage] = useState(1);
  const [youtubePage, setYoutubePage] = useState(1);
  const [matchPage, setMatchPage] = useState(1);
  const [resolvedCollageFolderUrls, setResolvedCollageFolderUrls] = useState<Record<string, string>>({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [removingCollageId, setRemovingCollageId] = useState("");
  const [adminMessage, setAdminMessage] = useState("");

  useEffect(() => {
    setQuery(getDigitsOnly(initialTeamNumber));
  }, [initialTeamNumber]);

  useEffect(() => {
    let isMounted = true;

    async function loadAdminSession() {
      try {
        const response = await fetch("/api/admin/session");
        const data = (await response.json().catch(() => null)) as {
          authenticated?: boolean;
        } | null;

        if (isMounted) {
          setIsAdmin(Boolean(data?.authenticated));
        }
      } catch {
        if (isMounted) {
          setIsAdmin(false);
        }
      }
    }

    void loadAdminSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedPreviewTeams = useMemo(() => pickRandomTeams(), []);
  // When there is no search yet, show a few real teams so the page does not feel empty.
  const searchableTeams = previewTeams.length > 0 ? previewTeams : teams;
  const filteredTeams = useMemo(
    () => searchTeams(query, searchableTeams),
    [query, searchableTeams],
  );
  const normalizedQuery = query.trim();
  const normalizedYearFilter = yearFilter.trim();
  const selectedYear = /^\d{4}$/.test(normalizedYearFilter)
    ? Number(normalizedYearFilter)
    : undefined;
  const isTeamNumberSearch = /^\d{1,5}$/.test(normalizedQuery);
  const shouldLookupTeam = isTeamNumberSearch;
  const sortedTeamCollages = useMemo(
    () =>
      getMediaCollages(
        selectedYear
          ? teamClips.filter((clip) => clip.year === selectedYear)
          : teamClips,
      ).map((collage) => ({
        ...collage,
        folderUrl: collage.folderUrl || resolvedCollageFolderUrls[collage.id],
      })),
    [resolvedCollageFolderUrls, selectedYear, teamClips],
  );
  const sortedTbaMedia = useMemo(
    () =>
      sortExternalMedia(
        selectedYear
          ? tbaMedia.filter((item) => item.year === selectedYear)
          : tbaMedia,
      ),
    [selectedYear, tbaMedia],
  );
  const sortedYoutubeResults = useMemo(
    () =>
      sortExternalMedia(
        selectedYear
          ? youtubeResults.filter((item) => item.year === selectedYear)
          : youtubeResults,
      ),
    [selectedYear, youtubeResults],
  );
  const sortedMatchVideos = useMemo(
    () =>
      sortMatchVideos(
        selectedYear
          ? matchVideos.filter((video) => video.year === selectedYear)
          : matchVideos,
      ),
    [matchVideos, selectedYear],
  );
  const visibleTeamCollages = useMemo(
    () => paginateItems(sortedTeamCollages, fmcPage),
    [fmcPage, sortedTeamCollages],
  );
  const visibleTbaMedia = useMemo(
    () => paginateItems(sortedTbaMedia, tbaPage),
    [sortedTbaMedia, tbaPage],
  );
  const visibleYoutubeResults = useMemo(
    () => paginateItems(sortedYoutubeResults, youtubePage),
    [sortedYoutubeResults, youtubePage],
  );
  const visibleMatchVideos = useMemo(
    () => paginateItems(sortedMatchVideos, matchPage),
    [matchPage, sortedMatchVideos],
  );

  useEffect(() => {
    setFmcPage(1);
    setTbaPage(1);
    setYoutubePage(1);
    setMatchPage(1);
  }, [normalizedQuery, normalizedYearFilter]);

  useEffect(() => {
    async function resolveCollageFolderUrl(collage: MediaCollage) {
      const coverClip = getCollageCoverClip(collage);

      //Checking for already in-use urls
      if (
        collage.folderUrl ||
        resolvedCollageFolderUrls[collage.id] ||
        !coverClip?.videoUrl
      ) {
        return;
      }

      try {
        const response = await fetch("/api/media/folder-url", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fileUrl: coverClip.videoUrl,
          }),
        });

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as {
          folderUrl?: string;
        };

        if (data.folderUrl) {
          setResolvedCollageFolderUrls((currentUrls) => ({
            ...currentUrls,
            [collage.id]: data.folderUrl || "",
          }));
        }
      } catch {
        // The card still falls back to the individual file link.
      }
    }

    sortedTeamCollages.forEach((collage) => {
      void resolveCollageFolderUrl(collage);
    });
  }, [resolvedCollageFolderUrls, sortedTeamCollages]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadPreviewTeams() {
      setIsLoadingPreviewTeams(true);

      try {
        const loadedTeams = await Promise.all(
          selectedPreviewTeams.map(async (teamNumber) => {
            const response = await fetch(`/api/team/${teamNumber}`, {
              signal: controller.signal,
            });

            if (!response.ok) {
              return null;
            }

            return (await response.json()) as Team;
          }),
        );

        if (!controller.signal.aborted) {
          setPreviewTeams(loadedTeams.filter(Boolean) as Team[]);
        }
      } catch {
        if (!controller.signal.aborted) {
          setPreviewTeams([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingPreviewTeams(false);
        }
      }
    }

    void loadPreviewTeams();

    return () => {
      controller.abort();
    };
  }, [selectedPreviewTeams]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadTeam() {
      if (!shouldLookupTeam) {
        setRemoteTeam(null);
        setIsLoadingTeam(false);
        return;
      }

      setIsLoadingTeam(true);

      try {
        const response = await fetch(`/api/team/${normalizedQuery}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          setRemoteTeam(null);
          return;
        }

        setRemoteTeam((await response.json()) as Team);
      } catch {
        if (!controller.signal.aborted) {
          setRemoteTeam(null);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingTeam(false);
        }
      }
    }

    void loadTeam();

    return () => {
      controller.abort();
    };
  }, [normalizedQuery, shouldLookupTeam]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadClipsForTeam() {
      if (!isTeamNumberSearch) {
        setTeamClips([]);
        setIsLoadingClips(false);
        return;
      }

      setIsLoadingClips(true);

      try {
        // The FMC uploads are go to approved media stored through Supabase/Google Drive.
        const clips = await getMediaClips({
          teamNumber: normalizedQuery,
        });

        if (!controller.signal.aborted) {
          setTeamClips(
            clips.sort((a, b) => b.year - a.year),
          );
        }
      } catch {
        if (!controller.signal.aborted) {
          setTeamClips([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingClips(false);
        }
      }
    }

    function handleMediaUploaded() {
      void loadClipsForTeam();
    }

    void loadClipsForTeam();
    window.addEventListener("fmc-media-uploaded", handleMediaUploaded);

    return () => {
      controller.abort();
      window.removeEventListener("fmc-media-uploaded", handleMediaUploaded);
    };
  }, [isTeamNumberSearch, normalizedQuery]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadTbaMediaForTeam() {
      if (!isTeamNumberSearch) {
        setTbaMedia([]);
        setIsLoadingTbaMedia(false);
        setTbaMediaConfigured(true);
        return;
      }

      setIsLoadingTbaMedia(true);

      try {
        // TBA gives us another source of team photos and media with the api key
        const response = await fetch(`/api/team/${normalizedQuery}/tba-media`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          setTbaMedia([]);
          return;
        }

        const data = (await response.json()) as ExternalMediaResponse;

        if (!controller.signal.aborted) {
          setTbaMedia(data.items);
          setTbaMediaConfigured(data.configured);
        }
      } catch {
        if (!controller.signal.aborted) {
          setTbaMedia([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingTbaMedia(false);
        }
      }
    }

    void loadTbaMediaForTeam();

    return () => {
      controller.abort();
    };
  }, [isTeamNumberSearch, normalizedQuery]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadYoutubeResultsForTeam() {
      if (!isTeamNumberSearch) {
        setYoutubeResults([]);
        setIsLoadingYoutubeResults(false);
        setYoutubeResultsConfigured(true);
        return;
      }

      setIsLoadingYoutubeResults(true);

      try {
        const response = await fetch(
          `/api/team/${normalizedQuery}/youtube-results`,
          {
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          setYoutubeResults([]);
          return;
        }

        const data = (await response.json()) as ExternalMediaResponse;

        if (!controller.signal.aborted) {
          setYoutubeResults(data.items);
          setYoutubeResultsConfigured(data.configured);
        }
      } catch {
        if (!controller.signal.aborted) {
          setYoutubeResults([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingYoutubeResults(false);
        }
      }
    }

    void loadYoutubeResultsForTeam();

    return () => {
      controller.abort();
    };
  }, [isTeamNumberSearch, normalizedQuery]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadMatchVideosForTeam() {
      if (!isTeamNumberSearch) {
        setMatchVideos([]);
        setIsLoadingMatchVideos(false);
        setMatchVideosConfigured(true);
        return;
      }

      setIsLoadingMatchVideos(true);

      try {
        // Match videos are searched separately so they can be sorted and paged on their own.
        const response = await fetch(
          `/api/team/${normalizedQuery}/match-videos`,
          {
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          setMatchVideos([]);
          return;
        }

        const data = (await response.json()) as MatchVideosResponse;

        if (!controller.signal.aborted) {
          setMatchVideos(data.videos);
          setMatchVideosConfigured(data.configured);
        }
      } catch {
        if (!controller.signal.aborted) {
          setMatchVideos([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingMatchVideos(false);
        }
      }
    }

    void loadMatchVideosForTeam();

    return () => {
      controller.abort();
    };
  }, [isTeamNumberSearch, normalizedQuery]);

  async function handleRemoveCollage(collage: MediaCollage) {
    const confirmed = window.confirm(
      `Remove ${collage.title}? This will delete the upload from Google Drive and the public media library.`,
    );

    if (!confirmed) {
      return;
    }

    setRemovingCollageId(collage.id);
    setAdminMessage("");

    try {
      const response = await fetch("/api/admin/media", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clipIds: collage.clips.map((clip) => clip.id),
          folderUrl: collage.folderUrl || resolvedCollageFolderUrls[collage.id],
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;

        throw new Error(data?.error || "Could not remove upload.");
      }

      setTeamClips((clips) =>
        clips.filter(
          (clip) => !collage.clips.some((collageClip) => collageClip.id === clip.id),
        ),
      );
      setAdminMessage("Upload removed.");
      window.dispatchEvent(new Event("fmc-media-uploaded"));
    } catch (error) {
      setAdminMessage(
        error instanceof Error
          ? error.message
          : "Could not remove upload. Check admin access.",
      );
    } finally {
      setRemovingCollageId("");
    }
  }

  return (
    <div className="scrap-card p-5">
      <label className="block">
        <span className="sr-only">Search teams</span>
        <div className="grid gap-3 md:grid-cols-[1fr_9rem]">
          <input
            className="h-12 w-full rounded-md border-2 border-[#17001C] bg-[#F4E7E7] px-4 text-sm text-[#17001C] outline-none ring-[#A335E6]/20 placeholder:text-[#17001C]/45 focus:border-[#7137E3] focus:ring-4"
            inputMode="numeric"
            maxLength={5}
            onChange={(event) => setQuery(getDigitsOnly(event.target.value))}
            pattern="[0-9]*"
            placeholder="Search teams by number"
            type="text"
            value={query}
          />
          <input
            aria-label="Filter media by year"
            className="h-12 w-full rounded-md border-2 border-[#17001C] bg-[#F4E7E7] px-4 text-sm text-[#17001C] outline-none ring-[#A335E6]/20 placeholder:text-[#17001C]/45 focus:border-[#7137E3] focus:ring-4"
            inputMode="numeric"
            maxLength={4}
            onChange={(event) => setYearFilter(event.target.value)}
            placeholder="Year"
            value={yearFilter}
          />
        </div>
      </label>

      {!isTeamNumberSearch && isLoadingPreviewTeams && !normalizedQuery ? (
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {selectedPreviewTeams.map((teamNumber) => (
            <div
              className="scrap-card min-h-64 animate-pulse p-5"
              key={teamNumber}
            >
              <div className="h-16 w-16 rounded-lg bg-[#F4E7E7]" />
              <div className="mt-5 h-5 w-28 rounded-md bg-[#F4E7E7]" />
              <div className="mt-4 h-4 w-full rounded-md bg-[#F4E7E7]" />
              <div className="mt-3 h-4 w-3/4 rounded-md bg-[#F4E7E7]" />
            </div>
          ))}
        </div>
      ) : null}

      {!isTeamNumberSearch && (!isLoadingPreviewTeams || normalizedQuery) ? (
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {filteredTeams.map((team) => (
            <TeamCard key={team.id} team={team} />
          ))}
        </div>
      ) : null}

      {isLoadingTeam ? (
        <div className="mt-6 rounded-lg border-2 border-dashed border-[#72007E] bg-[#F4E7E7] p-6 text-sm text-[#17001C]/70">
          Looking up FRC {normalizedQuery}...
        </div>
      ) : null}

      {isTeamNumberSearch && remoteTeam ? (
        <section className="mt-6">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b-4 border-[#17001C] pb-3">
            <div>
              <p className="text-sm text-[#72007E]">Team profile</p>
              <h2 className="text-2xl text-[#17001C]">
                FRC {normalizedQuery}
              </h2>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <TeamCard team={remoteTeam} />
          </div>
        </section>
      ) : null}

      {isTeamNumberSearch ? (
        <section className="mt-8">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b-4 border-[#F85259] pb-3">
            <div>
              <p className="text-sm text-[#72007E]">FMC Approved Media</p>
              <h2 className="text-2xl text-[#17001C]">
                FRC {normalizedQuery} community uploads
              </h2>
            </div>
          </div>

          {isLoadingClips ? (
            <div className="rounded-lg border-2 border-dashed border-[#72007E] bg-[#F4E7E7] p-6 text-sm text-[#17001C]/70">
              Loading uploaded media...
            </div>
          ) : null}

          {isAdmin && adminMessage ? (
            <p className="mb-4 text-sm text-[#17001C]/75">{adminMessage}</p>
          ) : null}

          {!isLoadingClips && sortedTeamCollages.length > 0 ? (
            <>
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {visibleTeamCollages.map((collage) => (
                  <div className="flex flex-col gap-3" key={collage.id}>
                    <MediaCollageCard collage={collage} />
                    {isAdmin ? (
                      <button
                        className="font-primary fmc-button h-10 bg-[#17001C] px-4 text-sm text-white hover:bg-[#72007E] disabled:opacity-60"
                        disabled={removingCollageId === collage.id}
                        onClick={() => void handleRemoveCollage(collage)}
                        type="button"
                      >
                        {removingCollageId === collage.id ? "Removing..." : "Remove"}
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
              <PaginationControls
                currentPage={fmcPage}
                itemCount={sortedTeamCollages.length}
                label="FMC Approved Media"
                onPageChange={setFmcPage}
              />
            </>
          ) : null}

          {!isLoadingClips && sortedTeamCollages.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-[#72007E] bg-[#F4E7E7] p-6 text-sm text-[#17001C]/70">
              Sorry there is no media for this team right now :/{" "}
              <a
                className="font-primary text-[#7137E3] underline decoration-[#F85259] decoration-2 underline-offset-4 hover:text-[#F85259]"
                href={uploadLink}
              >
                Maybe you can upload some?
              </a>
            </div>
          ) : null}
        </section>
      ) : null}

      {isTeamNumberSearch ? (
        <section className="mt-10">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b-4 border-[#7137E3] pb-3">
            <div>
              <p className="text-sm text-[#72007E]">The Blue Alliance Media</p>
              <h2 className="text-2xl text-[#17001C]">
                TBA media for FRC {normalizedQuery}
              </h2>
            </div>
          </div>

          {isLoadingTbaMedia ? (
            <div className="rounded-lg border-2 border-dashed border-[#72007E] bg-[#F4E7E7] p-6 text-sm text-[#17001C]/70">
              Loading TBA media...
            </div>
          ) : null}

          {!isLoadingTbaMedia && sortedTbaMedia.length > 0 ? (
            <>
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {visibleTbaMedia.map((item) => (
                  <ExternalMediaCard item={item} key={item.id} />
                ))}
              </div>
              <PaginationControls
                currentPage={tbaPage}
                itemCount={sortedTbaMedia.length}
                label="The Blue Alliance Media"
                onPageChange={setTbaPage}
              />
            </>
          ) : null}

          {!isLoadingTbaMedia && sortedTbaMedia.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-[#72007E] bg-[#F4E7E7] p-6 text-sm text-[#17001C]/70">
              {tbaMediaConfigured
                ? "No TBA media was found for this team yet."
                : "Add a TBA_AUTH_KEY server env var to show media from The Blue Alliance."}
            </div>
          ) : null}
        </section>
      ) : null}

      {isTeamNumberSearch ? (
        <section className="mt-10">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b-4 border-[#A335E6] pb-3">
            <div>
              <p className="text-sm text-[#72007E]">YouTube Results</p>
              <h2 className="text-2xl text-[#17001C]">
                Search results for FRC {normalizedQuery}
              </h2>
            </div>
          </div>

          {isLoadingYoutubeResults ? (
            <div className="rounded-lg border-2 border-dashed border-[#72007E] bg-[#F4E7E7] p-6 text-sm text-[#17001C]/70">
              Loading YouTube results...
            </div>
          ) : null}

          {!isLoadingYoutubeResults && sortedYoutubeResults.length > 0 ? (
            <>
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {visibleYoutubeResults.map((item) => (
                  <ExternalMediaCard item={item} key={item.id} />
                ))}
              </div>
              <PaginationControls
                currentPage={youtubePage}
                itemCount={sortedYoutubeResults.length}
                label="YouTube Results"
                onPageChange={setYoutubePage}
              />
            </>
          ) : null}

          {!isLoadingYoutubeResults && sortedYoutubeResults.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-[#72007E] bg-[#F4E7E7] p-6 text-sm text-[#17001C]/70">
              {youtubeResultsConfigured
                ? "No YouTube results were found for this team yet."
                : "Add a YOUTUBE_API_KEY server env var to show general YouTube search results."}
            </div>
          ) : null}
        </section>
      ) : null}

      {isTeamNumberSearch ? (
        <section className="mt-10">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b-4 border-[#F85259] pb-3">
            <div>
              <p className="text-sm text-[#72007E]">Match Video</p>
              <h2 className="text-2xl text-[#17001C]">
                YouTube matches featuring FRC {normalizedQuery}
              </h2>
            </div>
          </div>

          {isLoadingMatchVideos ? (
            <div className="rounded-lg border-2 border-dashed border-[#72007E] bg-[#F4E7E7] p-6 text-sm text-[#17001C]/70">
              Loading match videos...
            </div>
          ) : null}

          {!isLoadingMatchVideos && sortedMatchVideos.length > 0 ? (
            <>
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {visibleMatchVideos.map((video) => (
                  <MatchVideoCard key={video.id} video={video} />
                ))}
              </div>
              <PaginationControls
                currentPage={matchPage}
                itemCount={sortedMatchVideos.length}
                label="Match Video"
                onPageChange={setMatchPage}
              />
            </>
          ) : null}

          {!isLoadingMatchVideos && sortedMatchVideos.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-[#72007E] bg-[#F4E7E7] p-6 text-sm text-[#17001C]/70">
              {matchVideosConfigured
                ? "No match videos were found for this team yet."
                : "Add a TBA_AUTH_KEY server env var to show match videos from The Blue Alliance."}
            </div>
          ) : null}
        </section>
      ) : null}

      {filteredTeams.length === 0 && !isTeamNumberSearch ? (
        <div className="mt-6 rounded-lg border-2 border-dashed border-[#72007E] bg-[#F4E7E7] p-6 text-sm text-[#17001C]/70">
          Sorry there is no media for this team right now :/{" "}
          <a
            className="font-primary text-[#7137E3] underline decoration-[#F85259] decoration-2 underline-offset-4 hover:text-[#F85259]"
            href={uploadLink}
          >
            Maybe you can upload some?
          </a>
        </div>
      ) : null}
    </div>
  );
}
