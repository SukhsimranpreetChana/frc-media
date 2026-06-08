"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const splashStorageKey = "fmc-splash-intro-seen";
const splashHoldMs = 1100;
const splashFadeMs = 320;

export default function SplashIntro() {
  const [shouldRender, setShouldRender] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    const hasSeenSplash = window.localStorage.getItem(splashStorageKey);

    if (hasSeenSplash) {
      setShouldRender(false);
      return;
    }

    const leaveTimer = window.setTimeout(() => {
      setIsLeaving(true);
      window.localStorage.setItem(splashStorageKey, "true");
    }, splashHoldMs);
    const removeTimer = window.setTimeout(() => {
      setShouldRender(false);
    }, splashHoldMs + splashFadeMs);

    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(removeTimer);
    };
  }, []);

  if (!shouldRender) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className={`fmc-splash-intro ${isLeaving ? "fmc-splash-intro--leaving" : ""}`}
    >
      <Image
        alt=""
        className="fmc-splash-logo"
        height={108}
        priority
        src="/fmc-logo.png"
        width={212}
      />
    </div>
  );
}
