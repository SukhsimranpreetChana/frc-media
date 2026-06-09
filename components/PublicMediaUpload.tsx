"use client";

import { FormEvent, useState } from "react";

type PublicMediaUploadProps = {
  initialTeamNumber?: string;
};

type UploadSessionResponse = {
  error?: string;
  uploadGroupId?: string;
  uploadFolder?: {
    id: string;
    name: string;
    url: string;
  };
  sessions?: {
    clientId: string;
    uploadUrl: string;
    fileName: string;
  }[];
};

type GoogleDriveUploadResponse = {
  id?: string;
};

type UploadCompleteResponse = {
  error?: string;
};

const maxTotalUploadBytes = 2 * 1024 * 1024 * 1024;
const chunkSizeBytes = 16 * 1024 * 1024;

function getFileKey(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

function formatBytes(bytes: number) {
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

async function readJsonResponse<T>(response: Response): Promise<T | null> {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(text);
  }
}

async function uploadFileToGoogleDrive(input: {
  file: File;
  uploadUrl: string;
  onProgress: (uploadedBytes: number) => void;
}) {
  let uploadedBytes = 0;

  while (uploadedBytes < input.file.size) {
    const chunk = input.file.slice(
      uploadedBytes,
      Math.min(uploadedBytes + chunkSizeBytes, input.file.size),
    );
    const chunkEnd = uploadedBytes + chunk.size - 1;
    const response = await fetch(input.uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Range": `bytes ${uploadedBytes}-${chunkEnd}/${input.file.size}`,
        "Content-Type": input.file.type || "application/octet-stream",
      },
      body: chunk,
    });

    uploadedBytes += chunk.size;
    input.onProgress(uploadedBytes);

    if (response.status === 200 || response.status === 201) {
      const data = await readJsonResponse<GoogleDriveUploadResponse>(response);

      if (!data?.id) {
        throw new Error("Google Drive did not return an uploaded file id.");
      }

      return data.id;
    }

    if (response.status !== 308) {
      const errorText = await response.text().catch(() => "");
      throw new Error(errorText || "Google Drive rejected the upload chunk.");
    }
  }

  throw new Error("Google Drive upload did not finish.");
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
    const trimmedUploadedBy = uploadedBy.trim();
    const numericYear = Number(year);

    if (!trimmedTeamNumber || !numericYear || !trimmedUploadedBy || files.length === 0) {
      setMessage("Add a team number, year, your name, and at least one media file.");
      return;
    }

    const totalUploadBytes = files.reduce((total, file) => total + file.size, 0);

    if (totalUploadBytes > maxTotalUploadBytes) {
      setMessage(
        `Uploads can be up to ${formatBytes(maxTotalUploadBytes)} total. You selected ${formatBytes(totalUploadBytes)}.`,
      );
      return;
    }

    setIsUploading(true);

    try {
      setMessage("Starting Google Drive upload...");

      const clientFiles = files.map((file) => ({
        clientId: getFileKey(file),
        name: file.name,
        type: file.type,
        size: file.size,
      }));
      const sessionResponse = await fetch("/api/media/upload-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          teamNumber: trimmedTeamNumber,
          year: numericYear,
          uploadedBy: trimmedUploadedBy,
          title,
          files: clientFiles,
        }),
      });
      const sessionData =
        await readJsonResponse<UploadSessionResponse>(sessionResponse);

      if (
        !sessionResponse.ok ||
        !sessionData?.uploadGroupId ||
        !sessionData.uploadFolder ||
        !sessionData.sessions
      ) {
        throw new Error(sessionData?.error || "Unable to start upload.");
      }

      const uploadedFiles = [];

      for (const [fileIndex, file] of files.entries()) {
        const session = sessionData.sessions.find(
          (currentSession) => currentSession.clientId === getFileKey(file),
        );

        if (!session) {
          throw new Error(`Unable to start upload for ${file.name}.`);
        }

        setMessage(
          `Uploading ${file.name} (${fileIndex + 1}/${files.length})... 0%`,
        );

        const fileId = await uploadFileToGoogleDrive({
          file,
          uploadUrl: session.uploadUrl,
          onProgress: (uploadedBytes) => {
            const percent = Math.min(
              100,
              Math.round((uploadedBytes / file.size) * 100),
            );

            setMessage(
              `Uploading ${file.name} (${fileIndex + 1}/${files.length})... ${percent}%`,
            );
          },
        });
        const completeResponse = await fetch("/api/media/upload-complete", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fileId,
            teamNumber: trimmedTeamNumber,
            year: numericYear,
            uploadedBy: trimmedUploadedBy,
            title,
            uploadGroupId: sessionData.uploadGroupId,
            uploadFolder: sessionData.uploadFolder,
          }),
        });
        const completeData =
          await readJsonResponse<UploadCompleteResponse>(completeResponse);

        if (!completeResponse.ok) {
          throw new Error(completeData?.error || `Unable to finish ${file.name}.`);
        }

        uploadedFiles.push(file);
      }

      setMessage(
        `${uploadedFiles.length} file${uploadedFiles.length === 1 ? "" : "s"} submitted for review. Approved clips will show up on the Teams tab.`,
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
    <form
      className="scrap-card p-4 sm:p-5"
      id="upload-media"
      onSubmit={handleSubmit}
    >
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
            required
            value={uploadedBy}
          />
        </label>
        <div className="block text-sm text-[#17001C]/75 md:col-span-2">
          <span>Media Files</span>
          <input
            accept="image/*,video/*"
            className="sr-only"
            id="media-files"
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
          <div className="mt-2 flex flex-col gap-3 rounded-md border-2 border-[#17001C] bg-[#F4E7E7] p-3 sm:flex-row sm:items-center">
            <label
              className="font-primary fmc-file-picker inline-flex h-12 w-full cursor-pointer items-center justify-center rounded-md bg-[#F85259] px-4 text-center text-sm text-white sm:w-auto"
              htmlFor="media-files"
            >
              Choose files
            </label>
            <p className="min-w-0 text-sm text-[#17001C]/70">
              {files.length > 0
                ? `${files.length} file${files.length === 1 ? "" : "s"} selected`
                : "No files selected yet"}
            </p>
          </div>
          {files.length > 0 ? (
            <div className="mt-3 rounded-md border-2 border-[#17001C]/20 bg-white/70 p-3">
              <p className="text-xs text-[#17001C]/60">
                {files.length} file{files.length === 1 ? "" : "s"} selected
              </p>
              <ul className="mt-2 grid gap-2">
                {files.map((file) => (
                  <li
                    className="flex flex-col gap-3 rounded-md bg-[#F4E7E7] px-3 py-2 text-sm text-[#17001C] sm:flex-row sm:items-center sm:justify-between"
                    key={getFileKey(file)}
                  >
                    <span className="overflow-wrap-anywhere">
                      {file.name}
                    </span>
                    <button
                      className="font-primary rounded-md bg-[#17001C] px-3 py-2 text-xs text-white hover:bg-[#72007E] sm:py-1"
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
        </div>
      </div>
      <button
        className="font-primary fmc-button mt-5 h-11 w-full bg-[#F85259] px-4 text-sm text-white hover:bg-[#A335E6] disabled:opacity-60 sm:w-auto"
        disabled={isUploading}
        type="submit"
      >
        {isUploading ? "Uploading..." : "Upload media"}
      </button>
      {message ? <p className="mt-4 text-sm text-[#17001C]/75">{message}</p> : null}
    </form>
  );
}
