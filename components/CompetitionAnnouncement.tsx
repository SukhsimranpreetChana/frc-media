"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import { currentCompetitionDeadline } from "@/lib/competition";

const announcementVisibleMs = 14000;
const emptyTimeLeft = {
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
};

function getTimeLeft(deadlineTime: number) {
  const totalSeconds = Math.max(
    0,
    Math.floor((deadlineTime - Date.now()) / 1000),
  );
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds };
}

export default function CompetitionAnnouncement() {
  const deadlineTime = useMemo(
    () => new Date(currentCompetitionDeadline).getTime(),
    [],
  );
  const [timeLeft, setTimeLeft] = useState(emptyTimeLeft);
  const [shouldRender, setShouldRender] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    const showTimer = window.setTimeout(() => {
      setShouldRender(true);
    }, 1400);

    return () => {
      window.clearTimeout(showTimer);
    };
  }, []);

  useEffect(() => {
    if (!shouldRender) {
      return;
    }

    setTimeLeft(getTimeLeft(deadlineTime));

    const intervalId = window.setInterval(() => {
      setTimeLeft(getTimeLeft(deadlineTime));
    }, 1000);
    const hideTimer = window.setTimeout(() => {
      dismissAnnouncement();
    }, announcementVisibleMs);

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(hideTimer);
    };
  }, [deadlineTime, shouldRender]);

  function dismissAnnouncement() {
    setIsLeaving(true);
    window.setTimeout(() => setShouldRender(false), 320);
  }

  if (!shouldRender) {
    return null;
  }

  const countdownItems = [
    { label: "Days", value: timeLeft.days },
    { label: "Hours", value: timeLeft.hours },
    { label: "Min", value: timeLeft.minutes },
    { label: "Sec", value: timeLeft.seconds },
  ];

  return (
    <div
      className={`competition-announcement ${
        isLeaving ? "competition-announcement--leaving" : ""
      }`}
      role="region"
      aria-label="Editing competition announcement"
    >
      <div className="competition-confetti" aria-hidden="true">
        {Array.from({ length: 12 }).map((_, index) => (
          <span key={index} style={{ "--confetti-index": index } as CSSProperties} />
        ))}
      </div>
      <div className="competition-announcement-card">
        <div className="competition-announcement-copy">
          <p className="text-xs uppercase text-[#72007E]">Live right now</p>
          <h2 className="text-base text-[#17001C] sm:text-lg">
            Editing Competition Going On Right Now!
          </h2>
          <p className="text-xs leading-5 text-[#17001C]/75 sm:text-sm">
            FRCtees x FMC. $350 prize pool.
          </p>
        </div>
        <div className="competition-announcement-countdown">
          {countdownItems.map((item) => (
            <div className="competition-announcement-time" key={item.label}>
              <span>{String(item.value).padStart(2, "0")}</span>
              <small>{item.label}</small>
            </div>
          ))}
        </div>
        <div className="competition-announcement-actions">
          <Link
            className="font-primary fmc-button inline-flex h-9 items-center justify-center bg-[#F85259] px-3 text-xs text-white hover:bg-[#A335E6]"
            href="/competition"
            onClick={dismissAnnouncement}
          >
            View
          </Link>
          <button
            className="font-primary fmc-button inline-flex h-9 items-center justify-center bg-[#17001C] px-3 text-xs text-white hover:bg-[#72007E]"
            onClick={dismissAnnouncement}
            type="button"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
}
