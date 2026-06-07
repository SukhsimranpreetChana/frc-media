"use client";

import { FormEvent, useState } from "react";
import { mediaUploadUrl } from "@/lib/drive";
import { submitPendingClip } from "@/lib/supabase";

type PublicMediaUploadProps = {
  initialTeamNumber?: string;
};

export default function PublicMediaUpload({
  initialTeamNumber = "",
}: PublicMediaUploadProps) {
  const [teamNumber, setTeamNumber] = useState(initialTeamNumber);
  const [year, setYear] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [uploadedBy, setUploadedBy] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setMessage("");

    const trimmedTeamNumber = teamNumber.trim();
    const numericYear = Number(year);

    if (!trimmedTeamNumber || !numericYear || !videoUrl.trim() || !thumbnailUrl.trim()) {
      setMessage("Add a team number, year, clip URL, and thumbnail URL.");
      return;
    }

    setIsUploading(true);

    try {
      await submitPendingClip({
        teamNumber: trimmedTeamNumber,
        year: numericYear,
        videoUrl: videoUrl.trim(),
        thumbnailUrl: thumbnailUrl.trim(),
        uploadedBy,
      });
      setMessage("Submitted for review. Approved clips will show up on the Teams tab.");
      setTeamNumber(initialTeamNumber);
      setYear("");
      setVideoUrl("");
      setThumbnailUrl("");
      setUploadedBy("");
      form.reset();
      window.dispatchEvent(new Event("fmc-media-uploaded"));
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Check Supabase storage policies and try again.";

      setMessage(`Upload failed: ${errorMessage}`);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <form className="scrap-card p-5" id="upload-media" onSubmit={handleSubmit}>
      <h2 className="text-lg text-[#17001C]">Upload team media</h2>
      <p className="mt-2 text-sm text-[#17001C]/70">
        Add the clip to Icedrive, then submit its links here for admin review.
      </p>
      <div className="mt-4">
        <a
          className="font-primary fmc-button inline-flex h-10 items-center justify-center bg-[#7137E3] px-4 text-sm text-white hover:bg-[#A335E6]"
          href={mediaUploadUrl}
          rel="noopener noreferrer"
          target="_blank"
        >
          Open Icedrive upload
        </a>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="block text-sm text-[#17001C]/75">
          Team Number
          <input
            className="mt-2 h-11 w-full rounded-md border-2 border-[#17001C] bg-[#F4E7E7] px-4 text-sm text-[#17001C] outline-none ring-[#A335E6]/20 focus:border-[#7137E3] focus:ring-4"
            onChange={(event) => setTeamNumber(event.target.value)}
            required
            value={teamNumber}
          />
        </label>
        <label className="block text-sm text-[#17001C]/75">
          Year
          <input
            className="mt-2 h-11 w-full rounded-md border-2 border-[#17001C] bg-[#F4E7E7] px-4 text-sm text-[#17001C] outline-none ring-[#A335E6]/20 focus:border-[#7137E3] focus:ring-4"
            onChange={(event) => setYear(event.target.value)}
            required
            type="number"
            value={year}
          />
        </label>
        <label className="block text-sm text-[#17001C]/75 md:col-span-2">
          Icedrive Clip URL
          <input
            className="mt-2 h-11 w-full rounded-md border-2 border-[#17001C] bg-[#F4E7E7] px-4 text-sm text-[#17001C] outline-none ring-[#A335E6]/20 focus:border-[#7137E3] focus:ring-4"
            onChange={(event) => setVideoUrl(event.target.value)}
            placeholder="https://icedrive.net/..."
            required
            type="url"
            value={videoUrl}
          />
        </label>
        <label className="block text-sm text-[#17001C]/75 md:col-span-2">
          Thumbnail URL
          <input
            className="mt-2 h-11 w-full rounded-md border-2 border-[#17001C] bg-[#F4E7E7] px-4 text-sm text-[#17001C] outline-none ring-[#A335E6]/20 focus:border-[#7137E3] focus:ring-4"
            onChange={(event) => setThumbnailUrl(event.target.value)}
            placeholder="Paste an image URL for the preview"
            required
            type="url"
            value={thumbnailUrl}
          />
        </label>
        <label className="block text-sm text-[#17001C]/75 md:col-span-2">
          Uploaded By
          <input
            className="mt-2 h-11 w-full rounded-md border-2 border-[#17001C] bg-[#F4E7E7] px-4 text-sm text-[#17001C] outline-none ring-[#A335E6]/20 focus:border-[#7137E3] focus:ring-4"
            onChange={(event) => setUploadedBy(event.target.value)}
            placeholder="@handle or name"
            value={uploadedBy}
          />
        </label>
      </div>
      <button
        className="font-primary fmc-button mt-5 h-10 bg-[#F85259] px-4 text-sm text-white hover:bg-[#A335E6] disabled:opacity-60"
        disabled={isUploading}
        type="submit"
      >
        {isUploading ? "Uploading..." : "Upload media"}
      </button>
      {message ? <p className="mt-4 text-sm text-[#17001C]/75">{message}</p> : null}
    </form>
  );
}
