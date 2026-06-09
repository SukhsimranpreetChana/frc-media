"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const links = [
  { href: "/", label: "Home" },
  { href: "/teams", label: "Teams" },
  { href: "/upload", label: "Upload" },
  { href: "/commissions", label: "Commissions" },
  { href: "/contact", label: "Contact" },
  { href: "/admin", label: "Admin" },
];

const discordInvite = "https://discord.gg/xCqryxThbC";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="no-route-transition z-50 bg-transparent px-4 py-3">
      <nav className="fmc-dark-halftone flex w-full flex-col gap-4 rounded-2xl border-2 border-[#F85259]/50 px-6 py-4 shadow-[0_10px_0_rgba(23,0,28,0.22)] 2xl:flex-row 2xl:items-start 2xl:justify-between">
        <div className="nav-brand-row flex items-start justify-between gap-3">
          <Link className="nav-brand-link flex min-w-0 items-start gap-3 text-left" href="/">
            <Image
              alt="FIRST Media Community logo"
              className="h-auto w-20 shrink-0 object-contain 2xl:w-32"
              height={108}
              priority
              src="/fmc-logo.png"
              width={212}
            />
            <span className="font-primary nav-brand-name min-w-0 pb-2 text-lg leading-tight text-white 2xl:text-2xl">
              FIRST MEDIA COMMUNITY
            </span>
          </Link>
          <button
            aria-controls="site-navigation"
            aria-expanded={isMenuOpen}
            aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            className="nav-menu-toggle 2xl:hidden"
            onClick={() => setIsMenuOpen((current) => !current)}
            type="button"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
        <div
          className={`font-primary nav-menu-panel flex min-w-0 flex-wrap items-end gap-3 pb-2 text-lg text-[#F4E7E7] 2xl:flex 2xl:flex-nowrap 2xl:text-xl ${
            isMenuOpen ? "nav-menu-panel--open" : ""
          }`}
          id="site-navigation"
        >
          <div className="flex min-w-0 flex-wrap gap-3 2xl:flex-nowrap">
            {links.map((link) => (
              <Link
                className="nav-tab"
                href={link.href}
                key={link.href}
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="relative z-10">{link.label}</span>
              </Link>
            ))}
          </div>
          <a
            className="fmc-button inline-flex h-11 min-w-0 max-w-full shrink-0 items-center justify-center whitespace-nowrap bg-[#F85259] px-4 text-white hover:bg-[#A335E6] sm:min-w-32 sm:px-5"
            href={discordInvite}
            onClick={() => setIsMenuOpen(false)}
            target="_blank"
            rel="noopener noreferrer"
          >
            Join Us!
          </a>
        </div>
      </nav>
    </header>
  );
}
