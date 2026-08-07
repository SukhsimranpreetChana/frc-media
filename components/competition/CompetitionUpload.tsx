"use client";

import { FormEvent, useState } from "react";
import { useEffect } from "react";
import {
  currentCompetitionDeadline,
  isCurrentCompetitionOpen,
} from "@/lib/competition";

type UploadFolder = {
  id: string;
  name: string;
  url: string;
};

type UploadSessionResponse = {
  error?: string;
  competitionNumber?: number;
  uploadFolder?: UploadFolder;
  session?: {
    clientId: string;
    uploadUrl: string;
    fileName: string;
  };
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

const maxUploadBytes = 10 * 1024 * 1024 * 1024;
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
  const minutes = Math.floor(roundedSeconds / 60);
  const remainingSeconds = roundedSeconds % 60;

  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }

  return `${remainingSeconds}s`;
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

async function finishCompetitionUpload(payload: {
  fileId?: string;
  fileName: string;
  handle: string;
  submissionLink: string;
  uploadFolder: UploadFolder;
}) {
  const completeResponse = await fetch("/api/competition/upload-complete", {
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
}

export default function CompetitionUpload() {
  const [handle, setHandle] = useState("");
  const [submissionLink, setSubmissionLink] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [hasAcceptedRules, setHasAcceptedRules] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(
    null,
  );
  const [isCompetitionOpen, setIsCompetitionOpen] = useState(() =>
    isCurrentCompetitionOpen(),
  );

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setIsCompetitionOpen(isCurrentCompetitionOpen());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const trimmedHandle = handle.trim();
    const trimmedSubmissionLink = submissionLink.trim();

    setMessage("");

    if (!isCompetitionOpen) {
      setMessage("Competition submissions are closed.");
      return;
    }

    if (!hasAcceptedRules) {
      setMessage("Please agree to the contest requirements before submitting.");
      return;
    }

    if (!trimmedHandle || !trimmedSubmissionLink || !file) {
      setMessage("Add your handle, submission link, and one video file.");
      return;
    }

    if (!file.type.startsWith("video/") || file.size > maxUploadBytes) {
      setMessage("Contest uploads must be one video file up to 10 GB.");
      return;
    }

    setIsUploading(true);
    setUploadProgress({
      fileName: "Preparing upload",
      uploadedBytes: 0,
      totalBytes: file.size,
      percent: 0,
      etaLabel: "calculating...",
      speedLabel: "0 B/s",
    });

    try {
      setMessage("Starting Google Drive upload...");
      const uploadStartedAt = Date.now();
      const sessionResponse = await fetch("/api/competition/upload-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          handle: trimmedHandle,
          submissionLink: trimmedSubmissionLink,
          file: {
            clientId: getFileKey(file),
            name: file.name,
            type: file.type,
            size: file.size,
          },
        }),
      });
      const sessionData =
        await readJsonResponse<UploadSessionResponse>(sessionResponse);

      if (
        !sessionResponse.ok ||
        !sessionData?.session ||
        !sessionData.uploadFolder
      ) {
        throw new Error(sessionData?.error || "Unable to start upload.");
      }

      const fileId = await uploadFileToGoogleDrive({
        file,
        uploadUrl: sessionData.session.uploadUrl,
        onProgress: (uploadedBytes) => {
          const elapsedSeconds = (Date.now() - uploadStartedAt) / 1000;
          const bytesPerSecond =
            elapsedSeconds > 0 ? uploadedBytes / elapsedSeconds : 0;
          const remainingBytes = file.size - uploadedBytes;
          const percent = Math.min(
            100,
            Math.round((uploadedBytes / file.size) * 100),
          );

          setMessage(`Uploading ${file.name}... ${percent}%`);
          setUploadProgress({
            fileName: file.name,
            uploadedBytes,
            totalBytes: file.size,
            percent,
            etaLabel: formatDuration(remainingBytes / bytesPerSecond),
            speedLabel: `${formatBytes(bytesPerSecond)}/s`,
          });
        },
      });

      await finishCompetitionUpload({
        fileId,
        fileName: sessionData.session.fileName,
        handle: trimmedHandle,
        submissionLink: trimmedSubmissionLink,
        uploadFolder: sessionData.uploadFolder,
      });

      setUploadProgress({
        fileName: "Upload complete",
        uploadedBytes: file.size,
        totalBytes: file.size,
        percent: 100,
        etaLabel: "done",
        speedLabel: "complete",
      });
      setMessage("Your edit was submitted for admin review. Good luck!");
      setHandle("");
      setSubmissionLink("");
      setFile(null);
      setHasAcceptedRules(false);
      form.reset();
    } catch (error) {
      setUploadProgress(null);
      setMessage(
        error instanceof Error
          ? `Upload failed: ${error.message}`
          : "Upload failed. Please try again.",
      );
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <form className="scrap-card p-5" onSubmit={handleSubmit}>
      <h2 className="text-lg text-[#17001C]">Submit your edit</h2>
      <p className="mt-2 text-sm leading-6 text-[#17001C]/70">
        {isCompetitionOpen
          ? "Upload one final video file and include the public link you posted in submissions. One entry is allowed per handle."
          : "Competition submissions are closed. Admins can still review and score entries from the Admin tab."}
      </p>
      {!isCompetitionOpen ? (
        <div className="mt-4 rounded-md border-2 border-[#F85259] bg-[#F4E7E7] p-4 text-sm text-[#17001C]">
          The deadline passed on{" "}
          {new Date(currentCompetitionDeadline).toLocaleString()}. Thanks to
          everyone who entered.
        </div>
      ) : null}

      <div className="mt-5 grid gap-4">
        <label className="block text-sm text-[#17001C]/75">
          Handle
          <input
            className="mt-2 h-11 w-full rounded-md border-2 border-[#17001C] bg-[#F4E7E7] px-4 text-sm text-[#17001C] outline-none ring-[#A335E6]/20 focus:border-[#7137E3] focus:ring-4"
            disabled={isUploading || !isCompetitionOpen}
            onChange={(event) => setHandle(event.target.value)}
            placeholder="@yourhandle"
            required
            value={handle}
          />
        </label>

        <label className="block text-sm text-[#17001C]/75">
          Submission Link
          <input
            className="mt-2 h-11 w-full rounded-md border-2 border-[#17001C] bg-[#F4E7E7] px-4 text-sm text-[#17001C] outline-none ring-[#A335E6]/20 focus:border-[#7137E3] focus:ring-4"
            disabled={isUploading || !isCompetitionOpen}
            onChange={(event) => setSubmissionLink(event.target.value)}
            placeholder="Discord, Instagram, TikTok, YouTube, or other public link"
            required
            type="url"
            value={submissionLink}
          />
        </label>

        <div className="block text-sm text-[#17001C]/75">
          <span>Final Edit File</span>
          <input
            accept="video/*"
            className="sr-only"
            disabled={isUploading || !isCompetitionOpen}
            id="competition-file"
            onChange={(event) => {
              setFile(event.target.files?.[0] || null);
            }}
            required
            type="file"
          />
          <div className="mt-2 flex flex-col gap-3 rounded-md border-2 border-[#17001C] bg-[#F4E7E7] p-3 sm:flex-row sm:items-center">
            <label
              className="font-primary fmc-file-picker inline-flex h-12 w-full cursor-pointer items-center justify-center rounded-md bg-[#F85259] px-4 text-center text-sm text-white sm:w-auto"
              htmlFor="competition-file"
            >
              Choose video
            </label>
            <p className="min-w-0 text-sm text-[#17001C]/70">
              {file ? file.name : "No video selected yet"}
            </p>
          </div>
          <p className="mt-2 text-xs text-[#17001C]/60">
            Contest uploads can be up to 10 GB.
          </p>
        </div>
      </div>

      <section className="mt-5 rounded-md border-2 border-[#F85259] bg-[#F4E7E7] p-4 text-sm text-[#17001C]">
        <h3 className="text-base text-[#17001C]">Contest agreement</h3>
        <p className="mt-3 leading-6 text-[#17001C]/75">
          I understand this must be an FRC edit, include the FRCtees logo, be
          posted in submissions, and follow FMC community rules.
        </p>
        <label className="mt-4 flex items-start gap-3 text-sm font-semibold text-[#17001C]">
          <input
            checked={hasAcceptedRules}
            className="mt-1 h-4 w-4 accent-[#7137E3]"
            disabled={isUploading || !isCompetitionOpen}
            onChange={(event) => setHasAcceptedRules(event.target.checked)}
            type="checkbox"
          />
          <span>I agree to the contest requirements.</span>
        </label>
      </section>

      <button
        className="font-primary fmc-button mt-5 h-11 w-full bg-[#F85259] px-4 text-sm text-white hover:bg-[#A335E6] disabled:cursor-not-allowed disabled:bg-[#6f6673] disabled:opacity-65 disabled:shadow-none sm:w-auto"
        disabled={isUploading || !hasAcceptedRules || !isCompetitionOpen}
        type="submit"
      >
        {isUploading
          ? "Submitting..."
          : isCompetitionOpen
            ? "Submit edit"
            : "Submissions closed"}
      </button>

      {uploadProgress ? (
        <div className="mt-5 rounded-md border-2 border-[#17001C]/20 bg-white/75 p-3">
          <div className="flex flex-col gap-1 text-sm text-[#17001C]/75 sm:flex-row sm:items-center sm:justify-between">
            <span className="overflow-wrap-anywhere">
              {uploadProgress.fileName}
            </span>
            <span>
              {uploadProgress.percent}% / {uploadProgress.etaLabel}
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
