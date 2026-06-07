import Image from "next/image";
import PublicMediaUpload from "@/components/PublicMediaUpload";

export default function TeamsPage() {
  return (
    <main className="fmc-surface flex-1">
      <section className="mx-auto w-full max-w-6xl px-6 py-12">
        <div className="mb-10 max-w-2xl border-l-8 border-[#F85259] bg-white/75 px-5 py-4">
          <p className="text-sm text-[#72007E]">Public uploads</p>
          <h1 className="mt-2 text-3xl text-[#17001C]">Upload</h1>
          <p className="mt-4 text-[#17001C]/75">
            Submit team media with a team number, year, clip link, and
            thumbnail. Approved clips show up in team search from newest to
            oldest year.
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
        <PublicMediaUpload />
      </section>
    </main>
  );
}
