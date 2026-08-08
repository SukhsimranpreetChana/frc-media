"use client";

import { useEffect, useState } from "react";
import type { CompetitionSubmission } from "@/types";

type CompetitionSubmissionsAdminProps = {
  readOnly?: boolean;
};

type Scores = {
  creativityScore: string;
  effortScore: string;
  executionScore: string;
};

function getScoreTotal(submission: CompetitionSubmission) {
  return (
    (submission.creativityScore || 0) +
    (submission.effortScore || 0) +
    (submission.executionScore || 0)
  );
}

function getInitialScores(submission: CompetitionSubmission): Scores {
  return {
    creativityScore: submission.creativityScore?.toString() || "",
    effortScore: submission.effortScore?.toString() || "",
    executionScore: submission.executionScore?.toString() || "",
  };
}

function normalizeScoreInput(value: string) {
  const digitsOnly = value.replace(/\D/g, "");

  if (!digitsOnly) {
    return "";
  }

  return String(Math.min(10, Math.max(1, Number(digitsOnly))));
}

export default function CompetitionSubmissionsAdmin({
  readOnly = false,
}: CompetitionSubmissionsAdminProps) {
  const [submissions, setSubmissions] = useState<CompetitionSubmission[]>([]);
  const [scoresById, setScoresById] = useState<Record<string, Scores>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeSubmissionId, setActiveSubmissionId] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [message, setMessage] = useState("");

  async function loadSubmissions() {
    setIsLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/competition-submissions");
      const data = (await response.json().catch(() => null)) as {
        submissions?: CompetitionSubmission[];
        error?: string;
      } | null;

      if (!response.ok) {
        throw new Error(data?.error || "Could not load competition entries.");
      }

      const nextSubmissions = data?.submissions || [];
      setSubmissions(nextSubmissions);
      setCurrentIndex(0);
      setScoresById(
        Object.fromEntries(
          nextSubmissions.map((submission) => [
            submission.id,
            getInitialScores(submission),
          ]),
        ),
      );
    } catch {
      setMessage("Could not load competition submissions.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadSubmissions();
  }, []);

  useEffect(() => {
    setCurrentIndex((index) =>
      submissions.length === 0 ? 0 : Math.min(index, submissions.length - 1),
    );
  }, [submissions.length]);

  async function handleSaveScores(submission: CompetitionSubmission) {
    const scores = scoresById[submission.id] || getInitialScores(submission);

    setActiveSubmissionId(submission.id);
    setMessage("");

    try {
      const response = await fetch("/api/admin/competition-submissions", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: submission.id,
          creativityScore: scores.creativityScore,
          effortScore: scores.effortScore,
          executionScore: scores.executionScore,
        }),
      });
      const data = (await response.json().catch(() => null)) as {
        submission?: CompetitionSubmission;
        error?: string;
      } | null;

      if (!response.ok || !data?.submission) {
        throw new Error(data?.error || "Could not save scores.");
      }

      setSubmissions((currentSubmissions) =>
        currentSubmissions.map((currentSubmission) =>
          currentSubmission.id === submission.id
            ? (data.submission as CompetitionSubmission)
            : currentSubmission,
        ),
      );
      setScoresById((currentScores) => ({
        ...currentScores,
        [submission.id]: getInitialScores(data.submission as CompetitionSubmission),
      }));
      setMessage("Competition scores saved.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not save competition scores.",
      );
    } finally {
      setActiveSubmissionId("");
    }
  }

  async function handleRemoveSubmission(submission: CompetitionSubmission) {
    const confirmed = window.confirm(
      `Remove ${submission.handle}'s competition submission? This removes it from the admin competition list.`,
    );

    if (!confirmed) {
      return;
    }

    setActiveSubmissionId(submission.id);
    setMessage("");

    try {
      const response = await fetch("/api/admin/competition-submissions", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: submission.id,
        }),
      });
      const data = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        throw new Error(data?.error || "Could not remove submission.");
      }

      setSubmissions((currentSubmissions) =>
        currentSubmissions.filter(
          (currentSubmission) => currentSubmission.id !== submission.id,
        ),
      );
      setScoresById((currentScores) => {
        const nextScores = { ...currentScores };
        delete nextScores[submission.id];
        return nextScores;
      });
      setMessage("Competition submission removed.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not remove competition submission.",
      );
    } finally {
      setActiveSubmissionId("");
    }
  }

  function updateScore(
    submissionId: string,
    field: keyof Scores,
    value: string,
  ) {
    setScoresById((currentScores) => ({
      ...currentScores,
      [submissionId]: {
        ...(currentScores[submissionId] || {
          creativityScore: "",
          effortScore: "",
          executionScore: "",
        }),
        [field]: normalizeScoreInput(value),
      },
    }));
  }

  function moveSubmission(direction: "previous" | "next") {
    setCurrentIndex((index) => {
      if (direction === "previous") {
        return Math.max(0, index - 1);
      }

      return Math.min(submissions.length - 1, index + 1);
    });
  }

  function StarRatingRow(input: {
    label: string;
    field: keyof Scores;
    submission: CompetitionSubmission;
    value: string;
  }) {
    const score = Number(input.value) || 0;

    return (
      <div className="rounded-lg border-2 border-[#F85259]/45 bg-[#17001C]/70 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-[#F4E7E7]">{input.label}</p>
          <p className="text-xs uppercase text-[#F4E7E7]/70">{score || 0}/10</p>
        </div>
        <div className="mt-3 grid grid-cols-10 gap-1">
          {Array.from({ length: 10 }, (_, index) => {
            const starValue = index + 1;
            const isSelected = starValue <= score;

            return (
              <button
                aria-label={`${input.label} ${starValue} out of 10`}
                aria-pressed={isSelected}
                className={`competition-star-button ${
                  isSelected ? "competition-star-button--selected" : ""
                }`}
                disabled={readOnly || activeSubmissionId === input.submission.id}
                key={starValue}
                onClick={() =>
                  updateScore(input.submission.id, input.field, String(starValue))
                }
                type="button"
              >
                ★
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const currentSubmission = submissions[currentIndex];
  const currentScores = currentSubmission
    ? scoresById[currentSubmission.id] || getInitialScores(currentSubmission)
    : undefined;

  return (
    <section className="scrap-card mt-8 p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-lg text-[#17001C]">Competition submissions</h2>
          <p className="mt-2 text-sm text-[#17001C]/70">
            Review FRCtees x FMC entries and score creativity, effort, and
            execution from 1 to 10.
          </p>
        </div>
        <button
          className="font-primary fmc-button h-10 bg-[#7137E3] px-4 text-sm text-white hover:bg-[#A335E6] disabled:opacity-60"
          disabled={isLoading}
          onClick={() => void loadSubmissions()}
          type="button"
        >
          Refresh
        </button>
      </div>

      {message ? <p className="mt-4 text-sm text-[#17001C]/75">{message}</p> : null}

      {isLoading ? (
        <div className="mt-6 rounded-lg border-2 border-dashed border-[#72007E] bg-[#F4E7E7] p-6 text-sm text-[#17001C]/70">
          Loading competition submissions...
        </div>
      ) : null}

      {!isLoading && submissions.length === 0 ? (
        <div className="mt-6 rounded-lg border-2 border-dashed border-[#72007E] bg-[#F4E7E7] p-6 text-sm text-[#17001C]/70">
          No competition submissions yet.
        </div>
      ) : null}

      {!isLoading && currentSubmission && currentScores ? (
        <div className="mt-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <button
              className="font-primary fmc-button h-10 bg-[#17001C] px-4 text-sm text-white hover:bg-[#72007E] disabled:opacity-50"
              disabled={currentIndex === 0 || Boolean(activeSubmissionId)}
              onClick={() => moveSubmission("previous")}
              type="button"
            >
              Back
            </button>
            <p className="text-sm font-semibold text-[#17001C]/70">
              Submission {currentIndex + 1} of {submissions.length}
            </p>
            <button
              className="font-primary fmc-button h-10 bg-[#17001C] px-4 text-sm text-white hover:bg-[#72007E] disabled:opacity-50"
              disabled={
                currentIndex === submissions.length - 1 || Boolean(activeSubmissionId)
              }
              onClick={() => moveSubmission("next")}
              type="button"
            >
              Forward
            </button>
          </div>

          <article className="fmc-dark-halftone grid overflow-hidden rounded-2xl border-2 border-[#F85259]/50 text-white shadow-[8px_8px_0_#17001C] lg:grid-cols-[minmax(0,0.95fr)_minmax(22rem,1.05fr)]">
                <a
                  className="block"
                  href={currentSubmission.fileUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <div className="aspect-video h-full min-h-72 overflow-hidden bg-[#17001C] lg:aspect-auto">
                    {currentSubmission.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        alt=""
                        className="h-full w-full object-cover transition duration-300 hover:scale-105"
                        src={currentSubmission.thumbnailUrl}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm uppercase tracking-wide text-[#F4E7E7]/70">
                        Competition preview
                      </div>
                    )}
                  </div>
                </a>

                <div className="flex flex-1 flex-col gap-4 p-5">
                  <div>
                    <p className="scrap-chip inline-flex rounded-md px-2 py-1 text-sm text-[#17001C]">
                      Comp {currentSubmission.competitionNumber}
                    </p>
                    <h3 className="mt-3 text-xl text-white">
                      {currentSubmission.handle}
                    </h3>
                    <p className="mt-2 text-sm text-[#F4E7E7]">
                      {currentSubmission.reviewed
                        ? `Reviewed / ${getScoreTotal(currentSubmission)} total`
                        : "Waiting for scores"}
                    </p>
                  </div>

                  <div className="grid gap-3">
                    <StarRatingRow
                      field="creativityScore"
                      label="Creativity"
                      submission={currentSubmission}
                      value={currentScores.creativityScore}
                    />
                    <StarRatingRow
                      field="effortScore"
                      label="Effort"
                      submission={currentSubmission}
                      value={currentScores.effortScore}
                    />
                    <StarRatingRow
                      field="executionScore"
                      label="Execution"
                      submission={currentSubmission}
                      value={currentScores.executionScore}
                    />
                  </div>

                  <div className="mt-auto flex flex-col gap-3 sm:flex-row">
                    <a
                      className="font-primary fmc-button inline-flex h-10 items-center justify-center bg-[#F85259] px-4 text-sm text-white hover:bg-[#A335E6]"
                      href={currentSubmission.submissionLink}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      Link
                    </a>
                    <a
                      className="font-primary fmc-button inline-flex h-10 items-center justify-center bg-[#17001C] px-4 text-sm text-white hover:bg-[#72007E]"
                      href={currentSubmission.driveFolderUrl || currentSubmission.fileUrl}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      File
                    </a>
                    {!readOnly ? (
                      <button
                        className="font-primary fmc-button h-10 bg-[#7137E3] px-4 text-sm text-white hover:bg-[#A335E6] disabled:opacity-60"
                        disabled={activeSubmissionId === currentSubmission.id}
                        onClick={() => void handleSaveScores(currentSubmission)}
                        type="button"
                      >
                        {activeSubmissionId === currentSubmission.id
                          ? "Saving..."
                          : "Save"}
                      </button>
                    ) : null}
                    {!readOnly ? (
                      <button
                        className="font-primary fmc-button h-10 bg-[#17001C] px-4 text-sm text-white hover:bg-[#72007E] disabled:opacity-60"
                        disabled={activeSubmissionId === currentSubmission.id}
                        onClick={() => void handleRemoveSubmission(currentSubmission)}
                        type="button"
                      >
                        {activeSubmissionId === currentSubmission.id
                          ? "Working..."
                          : "Remove"}
                      </button>
                    ) : null}
                  </div>
                </div>
              </article>
        </div>
      ) : null}
    </section>
  );
}
