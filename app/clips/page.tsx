import TeamsFilter from "@/components/TeamsFilter";
import { featuredTeams } from "@/lib/search";

export default async function ClipsPage() {
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

        <TeamsFilter teams={featuredTeams} />
      </section>
    </main>
  );
}
