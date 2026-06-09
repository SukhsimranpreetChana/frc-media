import type { Metadata } from "next";
import TeamsFilter from "@/components/TeamsFilter";
import { featuredTeams } from "@/lib/search";

type TeamsPageProps = {
  searchParams: Promise<{
    team?: string | string[];
  }>;
};

export const metadata: Metadata = {
  title: "Teams | FIRST Media Community",
  description: "Search teams and uploaded team media by team number.",
  keywords: [
    "FRC team media",
    "FIRST team media",
    "FRC team photos",
    "FRC team videos",
    "FRC team clips",
    "FIRST Robotics team photos",
    "FIRST Robotics team videos",
    "FRC team search",
    "robotics team media library",
    "FRC media drive",
    "FIRST media archive",
    "FRC event photos",
    "FRC match videos",
  ],
};

function getSearchParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

function getDigitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

export default async function TeamsPage({ searchParams }: TeamsPageProps) {
  const params = await searchParams;
  const initialTeamNumber = getDigitsOnly(getSearchParamValue(params.team));

  return (
    <main className="fmc-surface flex-1">
      <section className="mx-auto w-full max-w-6xl px-6 py-12">
        <div className="mb-10 max-w-2xl border-l-8 border-[#F85259] bg-white/75 px-5 py-4">
          <p className="text-sm text-[#72007E]">Media library</p>
          <h1 className="mt-2 text-3xl text-[#17001C]">Teams</h1>
          <p className="mt-4 text-[#17001C]/75">
            Search teams and uploaded team media by team number.
          </p>
        </div>

        <TeamsFilter initialTeamNumber={initialTeamNumber} teams={featuredTeams} />
      </section>
    </main>
  );
}
