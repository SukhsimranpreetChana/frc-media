"use client";

import { useEffect, useState } from "react";

const termsStorageKey = "fmc-terms-accepted";

export default function TermsPrompt() {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

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
      aria-label="Terms of service prompt"
      className={`fixed inset-x-3 bottom-3 z-[70] mx-auto max-w-5xl rounded-xl border-2 border-[#F85259] bg-white p-4 text-[#17001C] shadow-[6px_6px_0_#17001C] transition duration-300 ease-out sm:inset-x-6 ${
        isLeaving ? "translate-y-4 opacity-0" : "translate-y-0 opacity-100"
      }`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-base text-[#17001C]">Terms of Service</h2>
          <p className="mt-2 text-sm leading-5 text-[#17001C]/75">
            By using FIRST Media Community, you agree to upload only media you
            have permission to share, keep submissions respectful, and allow FMC
            admins to review, approve, remove, and organize uploaded media.
          </p>
          {isExpanded ? (
            <div className="mt-3 grid gap-2 text-xs leading-5 text-[#17001C]/70">
              <p>
                Do not upload private, unsafe, hateful, or copyrighted content
                that you do not have rights to share.
              </p>
              <p>
                Public uploads may be stored in Google Drive and listed in team
                searches after approval.
              </p>
              <p>
                FMC may remove content or access to site features when needed to
                protect the community.
              </p>
            </div>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:min-w-48">
          <button
            className="font-primary fmc-button h-10 bg-[#F85259] px-4 text-sm text-white hover:bg-[#A335E6]"
            onClick={acceptTerms}
            type="button"
          >
            I agree
          </button>
          <button
            className="text-sm font-semibold text-[#72007E] underline decoration-[#F85259] decoration-2 underline-offset-4"
            onClick={() => setIsExpanded((current) => !current)}
            type="button"
          >
            {isExpanded ? "Hide terms" : "Read terms"}
          </button>
        </div>
      </div>
    </section>
  );
}
