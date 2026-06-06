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
    <header className="border-b border-[#72007E]/40 bg-[#17001C]">
      <nav className="flex w-full flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <Link className="flex items-center gap-3" href="/">
          <Image
            alt="FIRST Media Community logo"
            className="h-auto w-24 object-contain sm:w-32"
            height={108}
            priority
            src="/fmc-logo.png"
            width={212}
          />
          <span className="font-primary text-base text-white sm:text-lg">
            First Media Community
          </span>
        </Link>
        <div className="font-primary flex flex-wrap items-center gap-3 text-sm text-[#F4E7E7]">
          <div className="flex flex-wrap gap-3">
            {links.map((link) => (
              <Link
                className="rounded-md px-2 py-1 hover:bg-[#F85259] hover:text-white"
                href={link.href}
                key={link.href}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <a
            className="inline-flex h-10 items-center justify-center rounded-md bg-[#F85259] px-4 text-white hover:bg-[#A335E6]"
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
