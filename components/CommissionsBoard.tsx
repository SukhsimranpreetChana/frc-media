"use client";

import { useEffect, useState } from "react";
import CommissionCard from "@/components/CommissionCard";
import type { Commission } from "@/types";

export default function CommissionsBoard() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

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

  if (isLoading) {
    return (
      <div className="scrap-card mt-8 p-6 text-sm text-[#17001C]/75">
        Loading commissions...
      </div>
    );
  }

  if (error) {
    return (
      <div className="scrap-card mt-8 p-6 text-sm text-[#17001C]/75">
        {error}
      </div>
    );
  }

  if (commissions.length === 0) {
    return (
      <div className="scrap-card mt-8 p-6 text-sm text-[#17001C]/75">
        no commisions right no sorry :/
      </div>
    );
  }

  return (
    <div className="mt-8 grid gap-6 md:grid-cols-2">
      {commissions.map((commission) => (
        <CommissionCard commission={commission} key={commission.id} />
      ))}
    </div>
  );
}
