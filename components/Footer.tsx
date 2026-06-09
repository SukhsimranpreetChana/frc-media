"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { FooterHandle } from "@/types";

export default function Footer() {
  const [handles, setHandles] = useState<FooterHandle[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadFooterHandles() {
      try {
        const response = await fetch("/api/footer-handles");
        const data = (await response.json().catch(() => null)) as {
          handles?: FooterHandle[];
        } | null;

        if (response.ok && isMounted) {
          setHandles(data?.handles || []);
        }
      } catch {
        // The footer sponsor block still renders without profile links.
      }
    }

    void loadFooterHandles();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <footer className="mt-auto bg-[#17001C] text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-6 py-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-primary text-xl uppercase text-[#F4E7E7]">
              SPONSORED BY
            </span>
            <a
              aria-label="Visit FRCtees"
              href="https://frctees.com/"
              rel="noopener noreferrer"
              target="_blank"
            >
              <Image
                alt="FRCtees logo"
                className="h-auto w-24 object-contain sm:w-32"
                height={86}
                src="/frctees-logo.png"
                width={260}
              />
            </a>
          </div>

          {handles.length > 0 ? (
            <nav className="flex flex-wrap gap-3">
              {handles.map((item) => (
                <a
                  aria-label={item.handle}
                  className="group relative flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#F85259] bg-[#F4E7E7] text-sm text-[#17001C] shadow-[3px_3px_0_#F85259] transition hover:-translate-y-1 hover:shadow-[5px_5px_0_#A335E6]"
                  href={item.link}
                  key={item.id}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={item.handle}
                >
                  {item.profileImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      alt=""
                      className="h-full w-full rounded-full object-cover"
                      src={item.profileImageUrl}
                    />
                  ) : (
                    <span className="font-primary uppercase">
                      {item.handle.replace("@", "").slice(0, 1) || "?"}
                    </span>
                  )}
                  <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 rounded-md bg-[#17001C] px-2 py-1 text-xs text-white opacity-0 shadow-md transition group-hover:opacity-100">
                    {item.handle}
                  </span>
                </a>
              ))}
            </nav>
          ) : null}
        </div>

        <p className="max-w-4xl text-xs leading-5 text-[#F4E7E7]/70">
          We are not affiliated with FIRST HQ and FIRST® is not overseeing,
          involved with, or responsible for this activity, product, or service.
        </p>
      </div>
    </footer>
  );
}
