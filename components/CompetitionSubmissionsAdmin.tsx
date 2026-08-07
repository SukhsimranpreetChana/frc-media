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

      {!isLoading && submissions.length > 0 ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {submissions.map((submission) => {
            const scores = scoresById[submission.id] || getInitialScores(submission);

            return (
              <article
                className="fmc-dark-halftone flex h-full flex-col overflow-hidden rounded-2xl border-2 border-[#F85259]/50 text-white shadow-[8px_8px_0_#17001C]"
                key={submission.id}
              >
                <a
                  className="block"
                  href={submission.fileUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <div className="aspect-video overflow-hidden bg-[#17001C]">
                    {submission.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        alt=""
                        className="h-full w-full object-cover transition duration-300 hover:scale-105"
                        src={submission.thumbnailUrl}
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
                      Comp {submission.competitionNumber}
                    </p>
                    <h3 className="mt-3 text-xl text-white">
                      {submission.handle}
                    </h3>
                    <p className="mt-2 text-sm text-[#F4E7E7]">
                      {submission.reviewed
                        ? `Reviewed / ${getScoreTotal(submission)} total`
                        : "Waiting for scores"}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    {[
                      ["Creativity", "creativityScore"],
                      ["Effort", "effortScore"],
                      ["Execution", "executionScore"],
                    ].map(([label, field]) => (
                      <label className="text-sm text-[#F4E7E7]" key={field}>
                        {label}
                        <input
                          className="mt-2 h-10 w-full rounded-md border-2 border-[#F85259] bg-[#17001C] px-3 text-sm text-white outline-none ring-[#A335E6]/20 focus:border-[#A335E6] focus:ring-4"
                          disabled={readOnly || activeSubmissionId === submission.id}
                          inputMode="numeric"
                          maxLength={2}
                          onChange={(event) =>
                            updateScore(
                              submission.id,
                              field as keyof Scores,
                              event.target.value,
                            )
                          }
                          placeholder="1-10"
                          value={scores[field as keyof Scores]}
                        />
                      </label>
                    ))}
                  </div>

                  <div className="mt-auto flex flex-col gap-3 sm:flex-row">
                    <a
                      className="font-primary fmc-button inline-flex h-10 items-center justify-center bg-[#F85259] px-4 text-sm text-white hover:bg-[#A335E6]"
                      href={submission.submissionLink}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      Submission link
                    </a>
                    <a
                      className="font-primary fmc-button inline-flex h-10 items-center justify-center bg-[#17001C] px-4 text-sm text-white hover:bg-[#72007E]"
                      href={submission.driveFolderUrl || submission.fileUrl}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      Drive file
                    </a>
                    {!readOnly ? (
                      <button
                        className="font-primary fmc-button h-10 bg-[#7137E3] px-4 text-sm text-white hover:bg-[#A335E6] disabled:opacity-60"
                        disabled={activeSubmissionId === submission.id}
                        onClick={() => void handleSaveScores(submission)}
                        type="button"
                      >
                        {activeSubmissionId === submission.id
                          ? "Saving..."
                          : "Save scores"}
                      </button>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
