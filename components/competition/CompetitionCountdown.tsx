"use client";

import { useEffect, useMemo, useState } from "react";

type CompetitionCountdownProps = {
  deadline: string;
};

const emptyTimeLeft = {
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
  totalSeconds: 1,
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

  return { days, hours, minutes, seconds, totalSeconds };
}

export default function CompetitionCountdown({
  deadline,
}: CompetitionCountdownProps) {
  const deadlineTime = useMemo(() => new Date(deadline).getTime(), [deadline]);
  const [timeLeft, setTimeLeft] = useState(emptyTimeLeft);

  useEffect(() => {
    setTimeLeft(getTimeLeft(deadlineTime));

    const intervalId = window.setInterval(() => {
      setTimeLeft(getTimeLeft(deadlineTime));
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [deadlineTime]);

  const items = [
    { label: "Days", value: timeLeft.days },
    { label: "Hours", value: timeLeft.hours },
    { label: "Minutes", value: timeLeft.minutes },
    { label: "Seconds", value: timeLeft.seconds },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-4">
      {items.map((item) => (
        <div
          className="rounded-lg border-2 border-[#F85259]/70 bg-[#17001C] p-4 text-center text-white shadow-[4px_4px_0_#72007E]"
          key={item.label}
        >
          <p className="font-primary text-3xl">
            {String(item.value).padStart(2, "0")}
          </p>
          <p className="mt-1 text-xs uppercase text-[#F4E7E7]/75">
            {item.label}
          </p>
        </div>
      ))}
      {timeLeft.totalSeconds === 0 ? (
        <p className="sm:col-span-4 text-sm text-[#F85259]">
          The submission deadline has passed.
        </p>
      ) : null}
    </div>
  );
}
