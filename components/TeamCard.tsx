"use client";

import { useEffect, useState } from "react";
import type { Team } from "@/types";

type TeamCardProps = {
  team: Team;
};

type TeamFolderResponse = {
  hasFolder: boolean;
  folderUrl?: string;
  uploadUrl?: string;
  year?: number;
};

export default function TeamCard({ team }: TeamCardProps) {
  const [folderLink, setFolderLink] = useState("/teams#upload-media");
  const [buttonLabel, setButtonLabel] = useState("Upload media");

  useEffect(() => {
    const controller = new AbortController();

    async function loadTeamFolder() {
      setFolderLink("/teams#upload-media");
      setButtonLabel("Upload media");

      try {
        const response = await fetch(
          `/api/media/team-folder?teamNumber=${encodeURIComponent(team.number)}`,
          {
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as TeamFolderResponse;

        if (controller.signal.aborted) {
          return;
        }

        if (data.hasFolder && data.folderUrl) {
          setFolderLink(data.folderUrl);
          setButtonLabel(data.year ? `Find ${data.year} clips` : "Find clips");
          return;
        }

        setFolderLink(data.uploadUrl || "/teams#upload-media");
        setButtonLabel("Upload media");
      } catch {
        if (!controller.signal.aborted) {
          setFolderLink("/teams#upload-media");
          setButtonLabel("Upload media");
        }
      }
    }

    void loadTeamFolder();

    return () => {
      controller.abort();
    };
  }, [team.number]);

  const opensExternally = folderLink.startsWith("http");

  return (
    <article className="scrap-card flex h-full flex-col p-5">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#17001C] bg-[#F4E7E7] text-center text-sm text-[#17001C] shadow-[4px_4px_0_#F85259]">
          {team.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt=""
              className="h-full w-full object-contain p-1"
              src={team.logoUrl}
            />
          ) : (
            <span className="font-primary">{team.number}</span>
          )}
        </div>
        <div className="min-w-0">
          <p className="scrap-chip inline-flex rounded-md px-2 py-1 text-sm text-[#17001C]">
            FRC {team.number}
          </p>
        </div>
      </div>
      <h3 className="mt-3 overflow-wrap-anywhere text-lg leading-tight text-[#17001C]">
        {team.name}
      </h3>
      <p className="mt-2 text-sm leading-5 text-[#17001C]/75">
        {team.description}
      </p>
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-[#72007E]">
        <span>{team.location}</span>
        <span aria-hidden="true">/</span>
        <span>{team.mediaFocus}</span>
      </div>
      <a
        className="font-primary fmc-button mt-auto inline-flex h-10 items-center justify-center bg-[#7137E3] px-4 text-sm text-white hover:bg-[#A335E6]"
        href={folderLink}
        rel={opensExternally ? "noopener noreferrer" : undefined}
        target={opensExternally ? "_blank" : undefined}
      >
        {buttonLabel}
      </a>
    </article>
  );
}
