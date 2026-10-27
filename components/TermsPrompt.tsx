"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

// Bump the version when the terms change so everyone sees the notice again.
const termsStorageKey = "fmc-legal-notice-v1";

const linkClassName =
  "font-semibold text-[#72007E] underline decoration-[#F85259] decoration-2 underline-offset-4";

export default function TermsPrompt() {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    setIsVisible(window.localStorage.getItem(termsStorageKey) !== "true");
  }, []);

  function acceptTerms() {
    window.localStorage.setItem(termsStorageKey, "true");
    setIsLeaving(true);
    window.setTimeout(() => {
      setIsVisible(false);
    }, 320);
  }

  if (!isVisible) {
    return null;
  }

  return (
    <section
      aria-label="Terms, privacy, and cookies notice"
      className={`fixed inset-x-3 bottom-3 z-[70] mx-auto max-w-5xl rounded-xl border-2 border-[#F85259] bg-white p-4 text-[#17001C] shadow-[6px_6px_0_#17001C] transition duration-300 ease-out sm:inset-x-6 ${
        isLeaving ? "translate-y-4 opacity-0" : "translate-y-0 opacity-100"
      }`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-base text-[#17001C]">Terms, privacy &amp; cookies</h2>
          <p className="mt-2 text-sm leading-5 text-[#17001C]/80">
            By using FIRST Media Community, you agree to our{" "}
            <Link className={linkClassName} href="/terms">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link className={linkClassName} href="/privacy">
              Privacy Policy
            </Link>
            . We only use essential cookies and browser storage to keep the
            site working, like remembering your theme. No ads or tracking.{" "}
            <Link className={linkClassName} href="/cookies">
              Cookie Policy
            </Link>
          </p>
        </div>
        <button
          className="font-primary fmc-button fmc-button--primary h-10 shrink-0 px-4 text-sm sm:min-w-48"
          onClick={acceptTerms}
          type="button"
        >
          I agree
        </button>
      </div>
    </section>
  );
}
