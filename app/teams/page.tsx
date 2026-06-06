import TeamsFilter from "@/components/TeamsFilter";
import { featuredTeams } from "@/lib/search";

export default function TeamsPage() {
  return (
    <main className="flex-1 bg-zinc-50">
      <section className="mx-auto w-full max-w-6xl px-6 py-12">
        <div className="mb-8 max-w-2xl">
          <p className="text-sm font-medium text-zinc-500">Directory</p>
          <h1 className="mt-2 text-3xl font-bold text-zinc-950">Teams</h1>
          <p className="mt-4 text-zinc-700">
            Search by team number, name, location, or media focus. Each result
            links out to the Icedrive folder where clips and media can be
            found.
          </p>
        </div>
        <TeamsFilter teams={featuredTeams} />
      </section>
    </main>
  );
}
