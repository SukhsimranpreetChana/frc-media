import Image from "next/image";
import TeamsFilter from "@/components/TeamsFilter";
import { featuredTeams } from "@/lib/search";

export default function TeamsPage() {
  return (
    <main className="fmc-surface flex-1">
      <section className="mx-auto w-full max-w-6xl px-6 py-12">
        <div className="mb-10 max-w-2xl border-l-8 border-[#F85259] bg-white/75 px-5 py-4">
          <p className="text-sm text-[#72007E]">Directory</p>
          <h1 className="mt-2 text-3xl text-[#17001C]">Teams</h1>
          <p className="mt-4 text-[#17001C]/75">
            Search by team number, name, location, or media focus. Each result
            links out to the Icedrive folder where clips and media can be
            found.
          </p>
        </div>
        <figure className="scrap-card mb-10 rotate-[-0.5deg] overflow-hidden p-3">
          <div className="relative aspect-[16/7] overflow-hidden rounded-md border-2 border-[#17001C]">
            <Image
              alt="FIRST Championship field and audience"
              className="object-cover"
              fill
              priority
              sizes="100vw"
              src="/media/championship-field.png"
            />
          </div>
        </figure>
        <TeamsFilter teams={featuredTeams} />
      </section>
    </main>
  );
}
