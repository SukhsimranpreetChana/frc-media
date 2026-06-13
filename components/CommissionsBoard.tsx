"use client";

import { FormEvent, useEffect, useState } from "react";
import CommissionCard from "@/components/CommissionCard";
import type { Commission } from "@/types";

export default function CommissionsBoard() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isRequestFormOpen, setIsRequestFormOpen] = useState(false);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");
  const [requestTitle, setRequestTitle] = useState("");
  const [requestLink, setRequestLink] = useState("");
  const [requestCostRange, setRequestCostRange] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadCommissions() {
      try {
        const response = await fetch("/api/commissions");
        const data = (await response.json().catch(() => null)) as {
          commissions?: Commission[];
          error?: string;
        } | null;

        if (!response.ok) {
          throw new Error(data?.error || "Could not load commissions.");
        }

        if (isMounted) {
          setCommissions(data?.commissions || []);
        }
      } catch {
        if (isMounted) {
          setError("Could not load commissions right now.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadCommissions();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSubmitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRequestMessage("");

    const title = requestTitle.trim();
    const link = requestLink.trim();
    const costRange = requestCostRange.trim();

    if (!title || !link || !costRange) {
      setRequestMessage("Add a title, link, and cost range.");
      return;
    }

    setIsSubmittingRequest(true);

    try {
      const response = await fetch("/api/commission-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, link, costRange }),
      });
      const data = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        throw new Error(data?.error || "Could not submit commission request.");
      }

      setRequestTitle("");
      setRequestLink("");
      setRequestCostRange("");
      setIsRequestFormOpen(false);
      setRequestMessage("Request submitted. An admin will review it soon.");
    } catch (error) {
      setRequestMessage(
        error instanceof Error
          ? error.message
          : "Could not submit commission request.",
      );
    } finally {
      setIsSubmittingRequest(false);
    }
  }

  const requestPanel = (
    <section className="scrap-card mt-8 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg text-[#17001C]">Add your commission</h2>
          <p className="mt-2 text-sm text-[#17001C]/70">
            Submit your commission details for admin review.
          </p>
        </div>
        <button
          className="font-primary fmc-button h-10 bg-[#7137E3] px-4 text-sm text-white hover:bg-[#A335E6]"
          onClick={() => setIsRequestFormOpen((current) => !current)}
          type="button"
        >
          {isRequestFormOpen ? "Close request" : "Request to add yours"}
        </button>
      </div>

      {isRequestFormOpen ? (
        <form className="mt-5 grid gap-4" onSubmit={handleSubmitRequest}>
          <label className="block text-sm text-[#17001C]/75">
            Title
            <input
              className="mt-2 h-11 w-full rounded-md border-2 border-[#17001C] bg-[#F4E7E7] px-4 text-sm text-[#17001C] outline-none ring-[#A335E6]/20 focus:border-[#7137E3] focus:ring-4"
              maxLength={140}
              onChange={(event) => setRequestTitle(event.target.value)}
              value={requestTitle}
            />
          </label>
          <label className="block text-sm text-[#17001C]/75">
            Link
            <input
              className="mt-2 h-11 w-full rounded-md border-2 border-[#17001C] bg-[#F4E7E7] px-4 text-sm text-[#17001C] outline-none ring-[#A335E6]/20 focus:border-[#7137E3] focus:ring-4"
              maxLength={500}
              onChange={(event) => setRequestLink(event.target.value)}
              type="url"
              value={requestLink}
            />
          </label>
          <label className="block text-sm text-[#17001C]/75">
            Cost range
            <input
              className="mt-2 h-11 w-full rounded-md border-2 border-[#17001C] bg-[#F4E7E7] px-4 text-sm text-[#17001C] outline-none ring-[#A335E6]/20 focus:border-[#7137E3] focus:ring-4"
              maxLength={80}
              onChange={(event) => setRequestCostRange(event.target.value)}
              placeholder="$50-$150"
              value={requestCostRange}
            />
          </label>
          <button
            className="font-primary fmc-button h-10 bg-[#F85259] px-4 text-sm text-white hover:bg-[#A335E6] disabled:opacity-60 sm:w-fit"
            disabled={isSubmittingRequest}
            type="submit"
          >
            {isSubmittingRequest ? "Submitting..." : "Submit request"}
          </button>
        </form>
      ) : null}

      {requestMessage ? (
        <p className="mt-4 text-sm text-[#17001C]/75">{requestMessage}</p>
      ) : null}
    </section>
  );

  if (isLoading) {
    return (
      <>
        {requestPanel}
        <div className="scrap-card mt-8 p-6 text-sm text-[#17001C]/75">
          Loading commissions...
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        {requestPanel}
        <div className="scrap-card mt-8 p-6 text-sm text-[#17001C]/75">
          {error}
        </div>
      </>
    );
  }

  if (commissions.length === 0) {
    return (
      <>
        {requestPanel}
        <div className="scrap-card mt-8 p-6 text-sm text-[#17001C]/75">
          no commisions right no sorry :/
        </div>
      </>
    );
  }

  return (
    <>
      {requestPanel}
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {commissions.map((commission) => (
          <CommissionCard commission={commission} key={commission.id} />
        ))}
      </div>
    </>
  );
}
