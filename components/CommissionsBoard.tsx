"use client";

import { useSyncExternalStore } from "react";
import CommissionCard from "@/components/CommissionCard";
import {
  defaultCommissions,
  readStoredCommissions,
  subscribeToCommissions,
} from "@/lib/commissions";

export default function CommissionsBoard() {
  const commissions = useSyncExternalStore(
    subscribeToCommissions,
    readStoredCommissions,
    () => defaultCommissions,
  );

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
