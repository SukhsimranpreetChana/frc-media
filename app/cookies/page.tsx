import type { Metadata } from "next";
import Link from "next/link";
import LegalPage, { LegalSection } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Cookie Policy | FIRST Media Community",
  description:
    "The cookies and browser storage FIRST Media Community uses, and why.",
};

type StorageItem = {
  name: string;
  purpose: string;
  who: string;
  lasts: string;
};

const cookies: StorageItem[] = [
  {
    name: "fmc_admin_session",
    purpose: "Keeps an FMC admin logged in to the admin dashboard.",
    who: "Admins only",
    lasts: "8 hours",
  },
  {
    name: "fmc_discord_oauth_state",
    purpose: "Protects the Discord admin login from forged requests.",
    who: "Admins, while logging in",
    lasts: "10 minutes",
  },
  {
    name: "fmc_google_oauth_state",
    purpose: "Protects the Google Drive connection step from forged requests.",
    who: "Admins, while connecting Drive",
    lasts: "10 minutes",
  },
];

const browserStorage: StorageItem[] = [
  {
    name: "fmc-theme-v2",
    purpose: "Remembers whether you picked light or dark mode.",
    who: "Everyone",
    lasts: "Until you clear it",
  },
  {
    name: "fmc-legal-notice-v1",
    purpose: "Remembers that you closed the terms and cookies notice.",
    who: "Everyone",
    lasts: "Until you clear it",
  },
  {
    name: "fmc-splash-intro-seen",
    purpose: "Remembers that you already saw the intro animation.",
    who: "Everyone",
    lasts: "Until you clear it",
  },
];

function StorageTable({ items }: { items: StorageItem[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b-2 border-[#F85259] text-[#17001C]">
            <th className="py-2 pr-4 font-semibold">Name</th>
            <th className="py-2 pr-4 font-semibold">What it does</th>
            <th className="py-2 pr-4 font-semibold">Who gets it</th>
            <th className="py-2 font-semibold">How long</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              className="border-b border-[#17001C]/15 align-top"
              key={item.name}
            >
              <td className="py-3 pr-4 font-mono text-xs text-[#17001C]">
                {item.name}
              </td>
              <td className="py-3 pr-4">{item.purpose}</td>
              <td className="py-3 pr-4">{item.who}</td>
              <td className="py-3">{item.lasts}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function CookiesPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      intro={
        <p>
          FMC only uses cookies and browser storage that the site needs to
          work. There are no advertising, analytics, or tracking cookies, so
          there is nothing to opt out of.
        </p>
      }
      title="Cookie Policy"
    >
      <LegalSection title="What cookies are">
        <p>
          Cookies are small pieces of data a website saves in your browser.
          Browser storage (also called local storage) is similar, but it stays
          in your browser and is never sent to our server.
        </p>
      </LegalSection>

      <LegalSection title="Cookies we use">
        <p>
          Regular visitors do not get any cookies from FMC. These are only set
          for admins:
        </p>
        <StorageTable items={cookies} />
      </LegalSection>

      <LegalSection title="Browser storage we use">
        <StorageTable items={browserStorage} />
      </LegalSection>

      <LegalSection title="Other websites">
        <p>
          Some images on FMC, like YouTube thumbnails and community profile
          pictures, load from other websites. Loading an image does not give
          those websites FMC cookies, but they can see your IP address, as
          described in our <Link href="/privacy">Privacy Policy</Link>. Links
          that open other sites, like Discord or Google Drive, follow those
          sites&apos; own cookie policies.
        </p>
      </LegalSection>

      <LegalSection title="Managing cookies">
        <p>
          You can clear or block cookies and site data in your browser
          settings. Blocking them will not break browsing, but the site will
          forget your light/dark choice, show the notice again, and admins
          will not be able to stay logged in.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
