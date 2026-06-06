import Link from "next/link";

const links = [
  { href: "/", label: "Home" },
  { href: "/teams", label: "Teams" },
  { href: "/commissions", label: "Commissions" },
  { href: "/admin", label: "Admin" },
];

export default function Navbar() {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <nav className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <Link className="text-base font-bold text-zinc-950" href="/">
          FIRST Media Community
        </Link>
        <div className="flex flex-wrap gap-3 text-sm font-medium text-zinc-700">
          {links.map((link) => (
            <Link
              className="rounded-md px-2 py-1 hover:bg-zinc-100 hover:text-zinc-950"
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
