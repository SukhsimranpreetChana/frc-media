"use client";

import { FormEvent, useState } from "react";

type PublicMediaUploadProps = {
  initialTeamNumber?: string;
};

type UploadResponse = {
  ok?: boolean;
  error?: string;
  uploads?: unknown[];
};

function getFileKey(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

export default function PublicMediaUpload({
  initialTeamNumber = "",
}: PublicMediaUploadProps) {
  const [teamNumber, setTeamNumber] = useState(initialTeamNumber);
  const [year, setYear] = useState("");
  const [title, setTitle] = useState("");
  const [uploadedBy, setUploadedBy] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setMessage("");

    const trimmedTeamNumber = teamNumber.trim();
    const numericYear = Number(year);

    if (!trimmedTeamNumber || !numericYear || files.length === 0) {
      setMessage("Add a team number, year, and at least one media file.");
      return;
    }

    setIsUploading(true);

    try {
      const uploadData = new FormData();
      uploadData.set("teamNumber", trimmedTeamNumber);
      uploadData.set("year", String(numericYear));
      uploadData.set("uploadedBy", uploadedBy);
      uploadData.set("title", title);
      files.forEach((file) => {
        uploadData.append("files", file);
      });

      const response = await fetch("/api/media/upload", {
        method: "POST",
        body: uploadData,
      });

      const data = (await response.json()) as UploadResponse;

      if (!response.ok) {
        throw new Error(data.error || "Upload failed.");
      }

      setMessage(
        `${data.uploads?.length || files.length} file${files.length === 1 ? "" : "s"} submitted for review. Approved clips will show up on the Teams tab.`,
      );
      setTeamNumber(initialTeamNumber);
      setYear("");
      setTitle("");
      setUploadedBy("");
      setFiles([]);
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
        Upload photos or videos. FMC will save them to Google Drive in a folder
        for your name, then send each clip to admin review.
      </p>
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
          Title
          <input
            className="mt-2 h-11 w-full rounded-md border-2 border-[#17001C] bg-[#F4E7E7] px-4 text-sm text-[#17001C] outline-none ring-[#A335E6]/20 focus:border-[#7137E3] focus:ring-4"
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Optional title"
            value={title}
          />
        </label>
        <label className="block text-sm text-[#17001C]/75 md:col-span-2">
          Uploaded By
          <input
            className="mt-2 h-11 w-full rounded-md border-2 border-[#17001C] bg-[#F4E7E7] px-4 text-sm text-[#17001C] outline-none ring-[#A335E6]/20 focus:border-[#7137E3] focus:ring-4"
            onChange={(event) => setUploadedBy(event.target.value)}
            placeholder="@handle or name, used for your Drive folder"
            value={uploadedBy}
          />
        </label>
        <label className="block text-sm text-[#17001C]/75 md:col-span-2">
          Media Files
          <input
            accept="image/*,video/*"
            className="mt-2 block h-11 w-full rounded-md border-2 border-[#17001C] bg-[#F4E7E7] px-3 py-2 text-sm text-[#17001C] file:mr-3 file:rounded-md file:border-0 file:bg-[#F85259] file:px-3 file:py-1 file:text-white"
            multiple
            onChange={(event) => {
              const selectedFiles = Array.from(event.target.files || []);

              setFiles((currentFiles) => {
                const existingKeys = new Set(currentFiles.map(getFileKey));
                const newFiles = selectedFiles.filter(
                  (file) => !existingKeys.has(getFileKey(file)),
                );

                return [...currentFiles, ...newFiles];
              });
              event.target.value = "";
            }}
            type="file"
          />
          {files.length > 0 ? (
            <div className="mt-3 rounded-md border-2 border-[#17001C]/20 bg-white/70 p-3">
              <p className="text-xs text-[#17001C]/60">
                {files.length} file{files.length === 1 ? "" : "s"} selected
              </p>
              <ul className="mt-2 grid gap-2">
                {files.map((file) => (
                  <li
                    className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-[#F4E7E7] px-3 py-2 text-sm text-[#17001C]"
                    key={getFileKey(file)}
                  >
                    <span className="overflow-wrap-anywhere">
                      {file.name}
                    </span>
                    <button
                      className="font-primary rounded-md bg-[#17001C] px-3 py-1 text-xs text-white hover:bg-[#72007E]"
                      onClick={() =>
                        setFiles((currentFiles) =>
                          currentFiles.filter(
                            (currentFile) =>
                              getFileKey(currentFile) !== getFileKey(file),
                          ),
                        )
                      }
                      type="button"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
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
