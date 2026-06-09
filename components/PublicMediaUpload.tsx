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

type UploadProgress = {
  fileName: string;
  uploadedBytes: number;
  totalBytes: number;
  percent: number;
  etaLabel: string;
  speedLabel: string;
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

function formatDuration(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "calculating...";
  }

  const roundedSeconds = Math.ceil(seconds);
  const hours = Math.floor(roundedSeconds / 3600);
  const minutes = Math.floor((roundedSeconds % 3600) / 60);
  const remainingSeconds = roundedSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }

  return `${remainingSeconds}s`;
}

function getDigitsOnly(value: string) {
  return value.replace(/\D/g, "");
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
    const isFinalChunk = chunkEnd + 1 >= input.file.size;
    let response: Response;

    try {
      response = await fetch(input.uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Range": `bytes ${uploadedBytes}-${chunkEnd}/${input.file.size}`,
          "Content-Type": input.file.type || "application/octet-stream",
        },
        body: chunk,
      });
    } catch (error) {
      if (isFinalChunk) {
        input.onProgress(input.file.size);
        return undefined;
      }

      throw error;
    }

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

async function finishUploadedFile(payload: {
  fileId?: string;
  fileName: string;
  teamNumber: string;
  year: number;
  uploadedBy: string;
  title: string;
  uploadGroupId: string;
  uploadFolder: NonNullable<UploadSessionResponse["uploadFolder"]>;
  fileCount: number;
}) {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const completeResponse = await fetch("/api/media/upload-complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const completeData =
        await readJsonResponse<UploadCompleteResponse>(completeResponse);

      if (!completeResponse.ok) {
        throw new Error(completeData?.error || "Unable to finish upload.");
      }

      return;
    } catch (error) {
      lastError =
        error instanceof Error
          ? error
          : new Error("Unable to finish upload.");

      if (attempt < 4) {
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * (attempt + 1)),
        );
      }
    }
  }

  throw lastError || new Error("Unable to finish upload.");
}

export default function PublicMediaUpload({
  initialTeamNumber = "",
}: PublicMediaUploadProps) {
  const [teamNumber, setTeamNumber] = useState(getDigitsOnly(initialTeamNumber));
  const [year, setYear] = useState("");
  const [title, setTitle] = useState("");
  const [uploadedBy, setUploadedBy] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(
    null,
  );

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
    setUploadProgress({
      fileName: "Preparing upload",
      uploadedBytes: 0,
      totalBytes: totalUploadBytes,
      percent: 0,
      etaLabel: "calculating...",
      speedLabel: "0 B/s",
    });

    try {
      setMessage("Starting Google Drive upload...");
      const uploadStartedAt = Date.now();
      let completedUploadBytes = 0;

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
            const totalUploadedBytes = completedUploadBytes + uploadedBytes;
            const elapsedSeconds = (Date.now() - uploadStartedAt) / 1000;
            const bytesPerSecond =
              elapsedSeconds > 0 ? totalUploadedBytes / elapsedSeconds : 0;
            const remainingBytes = totalUploadBytes - totalUploadedBytes;
            const percent = Math.min(
              100,
              Math.round((totalUploadedBytes / totalUploadBytes) * 100),
            );

            setMessage(
              `Uploading ${file.name} (${fileIndex + 1}/${files.length})... ${percent}%`,
            );
            setUploadProgress({
              fileName: file.name,
              uploadedBytes: totalUploadedBytes,
              totalBytes: totalUploadBytes,
              percent,
              etaLabel: formatDuration(remainingBytes / bytesPerSecond),
              speedLabel: `${formatBytes(bytesPerSecond)}/s`,
            });
          },
        });
        completedUploadBytes += file.size;
        await finishUploadedFile({
          fileId,
          fileName: session.fileName,
          teamNumber: trimmedTeamNumber,
          year: numericYear,
          uploadedBy: trimmedUploadedBy,
          title,
          uploadGroupId: sessionData.uploadGroupId,
          uploadFolder: sessionData.uploadFolder,
          fileCount: files.length,
        });

        uploadedFiles.push(file);
      }

      setUploadProgress({
        fileName: "Upload complete",
        uploadedBytes: totalUploadBytes,
        totalBytes: totalUploadBytes,
        percent: 100,
        etaLabel: "done",
        speedLabel: "complete",
      });
      setMessage(
        `${uploadedFiles.length} file${uploadedFiles.length === 1 ? "" : "s"} submitted for review. Approved clips will show up on the Teams tab.`,
      );
      setTeamNumber(getDigitsOnly(initialTeamNumber));
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
      setUploadProgress(null);
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
            inputMode="numeric"
            maxLength={5}
            onChange={(event) =>
              setTeamNumber(getDigitsOnly(event.target.value))
            }
            pattern="[0-9]*"
            required
            type="text"
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
          <p className="mt-2 text-xs text-[#17001C]/60">
            Uploads can be up to 2 GB total.
          </p>
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
                      disabled={isUploading}
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
      {uploadProgress ? (
        <div className="mt-5 rounded-md border-2 border-[#17001C]/20 bg-white/75 p-3">
          <div className="flex flex-col gap-1 text-sm text-[#17001C]/75 sm:flex-row sm:items-center sm:justify-between">
            <span className="overflow-wrap-anywhere">
              {uploadProgress.fileName}
            </span>
            <span>
              {uploadProgress.percent}% · {uploadProgress.etaLabel}
            </span>
          </div>
          <div
            aria-label="Upload progress"
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={uploadProgress.percent}
            className="mt-3 h-4 overflow-hidden rounded-md border-2 border-[#17001C] bg-[#F4E7E7]"
            role="progressbar"
          >
            <div
              className="h-full bg-[#F85259] transition-[width] duration-300"
              style={{ width: `${uploadProgress.percent}%` }}
            />
          </div>
          <div className="mt-2 flex flex-col gap-1 text-xs text-[#17001C]/60 sm:flex-row sm:items-center sm:justify-between">
            <span>
              {formatBytes(uploadProgress.uploadedBytes)} of{" "}
              {formatBytes(uploadProgress.totalBytes)}
            </span>
            <span>{uploadProgress.speedLabel}</span>
          </div>
        </div>
      ) : null}
      {message ? <p className="mt-4 text-sm text-[#17001C]/75">{message}</p> : null}
    </form>
  );
}
