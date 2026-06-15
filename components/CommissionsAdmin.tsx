"use client";

import { FormEvent, useEffect, useState } from "react";
import CommissionCard from "@/components/CommissionCard";
import { downloadCsv, toCsv } from "@/lib/csvExport";
import type { Commission, CommissionRequest } from "@/types";

export default function CommissionsAdmin() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [commissionRequests, setCommissionRequests] = useState<CommissionRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);
  const [activeCommissionId, setActiveCommissionId] = useState("");
  const [activeRequestId, setActiveRequestId] = useState("");
  const [message, setMessage] = useState("");
  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [costRange, setCostRange] = useState("");
  const [editingCommissionId, setEditingCommissionId] = useState("");

  async function fetchCommissions() {
    const response = await fetch("/api/commissions");
    const data = (await response.json().catch(() => null)) as {
      commissions?: Commission[];
      error?: string;
    } | null;

    if (!response.ok) {
      throw new Error(data?.error || "Could not load commissions.");
    }

    return data?.commissions || [];
  }

  async function fetchCommissionRequests() {
    const response = await fetch("/api/commission-requests");
    const data = (await response.json().catch(() => null)) as {
      requests?: CommissionRequest[];
      error?: string;
    } | null;

    if (!response.ok) {
      throw new Error(data?.error || "Could not load commission requests.");
    }

    return data?.requests || [];
  }

  useEffect(() => {
    let isMounted = true;

    async function loadCommissions() {
      try {
        const [nextCommissions, nextRequests] = await Promise.all([
          fetchCommissions(),
          fetchCommissionRequests(),
        ]);

        if (isMounted) {
          setCommissions(nextCommissions);
          setCommissionRequests(nextRequests);
        }
      } catch {
        if (isMounted) {
          setMessage("Could not load commissions from Supabase.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setIsLoadingRequests(false);
        }
      }
    }

    void loadCommissions();

    return () => {
      isMounted = false;
    };
  }, []);

  function resetCommissionForm() {
    setTitle("");
    setLink("");
    setCostRange("");
    setEditingCommissionId("");
  }

  function startEditingCommission(commission: Commission) {
    setTitle(commission.title);
    setLink(commission.link);
    setCostRange(commission.costRange);
    setEditingCommissionId(commission.id);
    setMessage("");
  }

  async function handleSaveCommission(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const trimmedTitle = title.trim();
    const trimmedLink = link.trim();
    const trimmedCostRange = costRange.trim();

    if (!trimmedTitle || !trimmedLink || !trimmedCostRange) {
      return;
    }

    setActiveCommissionId(editingCommissionId || "new");

    try {
      const response = await fetch("/api/commissions", {
        method: editingCommissionId ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingCommissionId || undefined,
          title: trimmedTitle,
          link: trimmedLink,
          costRange: trimmedCostRange,
        }),
      });
      const data = (await response.json().catch(() => null)) as {
        commission?: Commission;
        error?: string;
      } | null;

      if (!response.ok || !data?.commission) {
        throw new Error(
          data?.error ||
            (editingCommissionId
              ? "Could not update commission."
              : "Could not add commission."),
        );
      }

      if (editingCommissionId) {
        setCommissions((currentCommissions) =>
          currentCommissions.map((commission) =>
            commission.id === editingCommissionId
              ? (data.commission as Commission)
              : commission,
          ),
        );
        setMessage("Commission updated.");
      } else {
        setCommissions((currentCommissions) => [
          data.commission as Commission,
          ...currentCommissions,
        ]);
        setMessage("Commission posted.");
      }
      resetCommissionForm();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : editingCommissionId
            ? "Could not update commission."
            : "Could not add commission.",
      );
    } finally {
      setActiveCommissionId("");
    }
  }

  async function handleRemoveCommission(id: string) {
    setActiveCommissionId(id);
    setMessage("");

    try {
      const response = await fetch("/api/commissions", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });
      const data = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        throw new Error(data?.error || "Could not remove commission.");
      }

      setCommissions((currentCommissions) =>
        currentCommissions.filter((commission) => commission.id !== id),
      );
      setMessage("Commission removed.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not remove commission.",
      );
    } finally {
      setActiveCommissionId("");
    }
  }

  async function handleApproveRequest(request: CommissionRequest) {
    setActiveRequestId(request.id);
    setMessage("");

    try {
      const response = await fetch("/api/commission-requests", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: request.id,
          title: request.title,
          link: request.link,
          costRange: request.costRange,
        }),
      });
      const data = (await response.json().catch(() => null)) as {
        commission?: Commission;
        error?: string;
      } | null;

      if (!response.ok || !data?.commission) {
        throw new Error(data?.error || "Could not approve commission request.");
      }

      setCommissionRequests((requests) =>
        requests.filter((currentRequest) => currentRequest.id !== request.id),
      );
      setCommissions((currentCommissions) => [
        data.commission as Commission,
        ...currentCommissions,
      ]);
      setMessage("Commission request approved and posted.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not approve commission request.",
      );
    } finally {
      setActiveRequestId("");
    }
  }

  async function handleDenyRequest(id: string) {
    setActiveRequestId(id);
    setMessage("");

    try {
      const response = await fetch("/api/commission-requests", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });
      const data = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        throw new Error(data?.error || "Could not deny commission request.");
      }

      setCommissionRequests((requests) =>
        requests.filter((request) => request.id !== id),
      );
      setMessage("Commission request denied.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not deny commission request.",
      );
    } finally {
      setActiveRequestId("");
    }
  }

  function handleExportCommissions() {
    const csv = toCsv(commissions, [
      { header: "id", value: (commission) => commission.id },
      { header: "title", value: (commission) => commission.title },
      { header: "link", value: (commission) => commission.link },
      { header: "cost_range", value: (commission) => commission.costRange },
    ]);

    downloadCsv("fmc-commissions.csv", csv);
  }

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(280px,420px)_1fr]">
      <form className="scrap-card p-6" onSubmit={handleSaveCommission}>
        <h2 className="text-lg text-[#17001C]">
          {editingCommissionId ? "Edit commission" : "Post a commission"}
        </h2>
        <div className="mt-5 grid gap-4">
          <label className="block text-sm text-[#17001C]/75">
            Title
            <input
              className="mt-2 h-11 w-full rounded-md border-2 border-[#17001C] bg-[#F4E7E7] px-4 text-sm text-[#17001C] outline-none ring-[#A335E6]/20 focus:border-[#7137E3] focus:ring-4"
              onChange={(event) => setTitle(event.target.value)}
              value={title}
            />
          </label>
          <label className="block text-sm text-[#17001C]/75">
            Link
            <input
              className="mt-2 h-11 w-full rounded-md border-2 border-[#17001C] bg-[#F4E7E7] px-4 text-sm text-[#17001C] outline-none ring-[#A335E6]/20 focus:border-[#7137E3] focus:ring-4"
              onChange={(event) => setLink(event.target.value)}
              type="url"
              value={link}
            />
          </label>
          <label className="block text-sm text-[#17001C]/75">
            Cost range
            <input
              className="mt-2 h-11 w-full rounded-md border-2 border-[#17001C] bg-[#F4E7E7] px-4 text-sm text-[#17001C] outline-none ring-[#A335E6]/20 focus:border-[#7137E3] focus:ring-4"
              onChange={(event) => setCostRange(event.target.value)}
              placeholder="$50-$150"
              value={costRange}
            />
          </label>
        </div>
        <button
          className="font-primary fmc-button mt-5 h-10 bg-[#F85259] px-4 text-sm text-white hover:bg-[#A335E6]"
          disabled={activeCommissionId === (editingCommissionId || "new")}
          type="submit"
        >
          {activeCommissionId === (editingCommissionId || "new")
            ? "Saving..."
            : editingCommissionId
              ? "Save commission"
              : "Add commission"}
        </button>
        {editingCommissionId ? (
          <button
            className="ml-3 mt-5 h-10 px-4 text-sm font-semibold text-[#72007E] underline decoration-[#F85259] decoration-2 underline-offset-4"
            onClick={resetCommissionForm}
            type="button"
          >
            Cancel
          </button>
        ) : null}
        {message ? (
          <p className="mt-3 text-sm text-[#17001C]/70">{message}</p>
        ) : null}
      </form>

      <div>
        <section className="mb-8">
          <h2 className="text-lg text-[#17001C]">Commission requests</h2>
          {isLoadingRequests ? (
            <p className="scrap-card mt-5 p-5 text-sm text-[#17001C]/75">
              Loading commission requests...
            </p>
          ) : null}
          {!isLoadingRequests && commissionRequests.length === 0 ? (
            <p className="scrap-card mt-5 p-5 text-sm text-[#17001C]/75">
              No commission requests waiting for review.
            </p>
          ) : null}
          <div className="mt-5 grid gap-6 md:grid-cols-2">
            {commissionRequests.map((request) => (
              <div className="relative flex flex-col gap-3" key={request.id}>
                <CommissionCard commission={request} />
                <div className="flex gap-3">
                  <button
                    className="font-primary fmc-button h-10 flex-1 bg-[#F85259] px-4 text-sm text-white hover:bg-[#A335E6] disabled:opacity-60"
                    disabled={activeRequestId === request.id}
                    onClick={() => void handleApproveRequest(request)}
                    type="button"
                  >
                    Approve
                  </button>
                  <button
                    className="font-primary fmc-button h-10 flex-1 bg-[#17001C] px-4 text-sm text-white hover:bg-[#72007E] disabled:opacity-60"
                    disabled={activeRequestId === request.id}
                    onClick={() => void handleDenyRequest(request.id)}
                    type="button"
                  >
                    Deny
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg text-[#17001C]">Posted commissions</h2>
          <button
            className="font-primary fmc-button h-10 bg-[#17001C] px-4 text-sm text-white hover:bg-[#72007E] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={commissions.length === 0}
            onClick={handleExportCommissions}
            type="button"
          >
            Export CSV
          </button>
        </div>
        {isLoading ? (
          <p className="scrap-card mt-5 p-5 text-sm text-[#17001C]/75">
            Loading commissions...
          </p>
        ) : null}
        <div className="mt-5 grid gap-6 md:grid-cols-2">
          {commissions.map((commission) => (
            <div className="relative" key={commission.id}>
              <CommissionCard commission={commission} />
              <button
                className="font-primary fmc-button absolute right-4 top-4 bg-[#17001C] px-3 py-2 text-xs text-white hover:bg-[#72007E]"
                disabled={activeCommissionId === commission.id}
                onClick={() => void handleRemoveCommission(commission.id)}
                type="button"
              >
                {activeCommissionId === commission.id ? "Removing..." : "Remove"}
              </button>
              <button
                className="font-primary fmc-button absolute right-4 top-16 bg-[#7137E3] px-3 py-2 text-xs text-white hover:bg-[#A335E6]"
                disabled={activeCommissionId === commission.id}
                onClick={() => startEditingCommission(commission)}
                type="button"
              >
                Edit
              </button>
            </div>
          ))}
        </div>
        {!isLoading && commissions.length === 0 ? (
          <p className="scrap-card mt-5 p-5 text-sm text-[#17001C]/75">
            no commisions right no sorry :/
          </p>
        ) : null}
      </div>
    </div>
  );
}
