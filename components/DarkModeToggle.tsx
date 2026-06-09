"use client";

import { useEffect, useState } from "react";

const storageKey = "fmc-theme-v2";

function getPreferredTheme() {
  if (typeof window === "undefined") {
    return "light";
  }

  const savedTheme = window.localStorage.getItem(storageKey);
  if (savedTheme === "dark" || savedTheme === "light") {
    return savedTheme;
  }

  return "light";
}

export default function DarkModeToggle() {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const preferredTheme = getPreferredTheme();
    document.documentElement.dataset.theme = preferredTheme;
    window.requestAnimationFrame(() => {
      setTheme(preferredTheme);
    });
  }, []);

  const isDark = theme === "dark";

  function toggleTheme() {
    const nextTheme = isDark ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem(storageKey, nextTheme);
  }

  return (
    <button
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={isDark}
      className="theme-toggle no-route-transition"
      onClick={toggleTheme}
      title={isDark ? "Light mode" : "Dark mode"}
      type="button"
    >
      <span aria-hidden="true" className="theme-toggle__track">
        <span className="theme-toggle__knob" />
      </span>
    </button>
  );
}
