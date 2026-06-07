import Image from "next/image";
import Link from "next/link";

const links = [
  { href: "/", label: "Home" },
  { href: "/teams", label: "Teams" },
  { href: "/commissions", label: "Commissions" },
  { href: "/admin", label: "Admin" },
];

const discordInvite = "https://discord.gg/xCqryxThbC";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-transparent px-4 py-3">
      <nav className="fmc-dark-halftone flex w-full flex-col gap-4 rounded-2xl border-2 border-[#F85259]/50 px-6 py-4 shadow-[0_10px_0_rgba(23,0,28,0.22)] sm:flex-row sm:items-end sm:justify-between">
        <Link className="flex items-end gap-3" href="/">
          <Image
            alt="FIRST Media Community logo"
            className="h-auto w-24 object-contain sm:w-32"
            height={108}
            priority
            src="/fmc-logo.png"
            width={212}
          />
          <span className="font-primary pb-2 text-xl text-white sm:text-2xl">
            FIRST MEDIA COMMUNITY
          </span>
        </Link>
        <div className="font-primary flex flex-wrap items-end gap-3 pb-2 text-lg text-[#F4E7E7] sm:text-xl">
          <div className="flex flex-wrap gap-3">
            {links.map((link) => (
              <Link
                className="rounded-md px-2 py-1 underline decoration-[#F85259] decoration-4 underline-offset-8 hover:bg-[#F85259] hover:text-white"
                href={link.href}
                key={link.href}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <a
            className="fmc-button inline-flex h-11 items-center justify-center bg-[#F85259] px-5 text-white hover:bg-[#A335E6]"
            href={discordInvite}
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
