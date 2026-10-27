import Link from "next/link";
import type { ReactNode } from "react";

export const legalLastUpdated = "October 25, 2026";

const legalLinks = [
  { href: "/terms", label: "Terms of Service" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/cookies", label: "Cookie Policy" },
];

type LegalPageProps = {
  eyebrow: string;
  title: string;
  intro: ReactNode;
  children: ReactNode;
};

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="text-xl text-[#17001C]">{title}</h2>
      <div className="mt-3 grid gap-3 leading-7 text-[#17001C]/80">
        {children}
      </div>
    </section>
  );
}

export default function LegalPage({
  eyebrow,
  title,
  intro,
  children,
}: LegalPageProps) {
  return (
    <main className="fmc-surface flex-1">
      <section className="page-container py-12">
        <div className="page-intro max-w-2xl border-l-8 border-[#F85259] bg-white/75 px-5 py-4">
          <p className="text-sm text-[#72007E]">{eyebrow}</p>
          <h1 className="mt-2 text-3xl text-[#17001C]">{title}</h1>
          <p className="mt-2 text-sm text-[#17001C]/80">
            Last updated {legalLastUpdated}
          </p>
          <div className="mt-4 text-[#17001C]/80">{intro}</div>
        </div>

        <nav
          aria-label="Legal pages"
          className="mt-6 flex flex-wrap gap-2 text-sm"
        >
          {legalLinks.map((link) =>
            link.label === title ? (
              <span
                aria-current="page"
                className="rounded-md border-2 border-[#F85259] bg-[#F85259] px-3 py-1 text-white"
                key={link.href}
              >
                {link.label}
              </span>
            ) : (
              <Link
                className="rounded-md border-2 border-[#17001C] bg-white/75 px-3 py-1 text-[#17001C] hover:border-[#F85259]"
                href={link.href}
                key={link.href}
              >
                {link.label}
              </Link>
            ),
          )}
        </nav>

        <div className="legal-content scrap-card mt-8 grid max-w-4xl gap-8 p-6 sm:p-8">
          {children}
        </div>
      </section>
    </main>
  );
}
