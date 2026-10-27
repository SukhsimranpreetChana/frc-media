import type { Metadata } from "next";
import Image from "next/image";
import PublicMediaUpload from "@/components/PublicMediaUpload";
import UploadLeaderboard from "@/components/UploadLeaderboard";

const alexCredit = "Photo taken by FMC Member Alex on 5193.";

type UploadPageProps = {
  searchParams: Promise<{
    team?: string | string[];
  }>;
};

export const metadata: Metadata = {
  title: "Upload | FIRST Media Community",
  description:
    "Submit team media with a team number, year, and media file for admin review.",
  keywords: [
    "upload FRC media",
    "submit FRC photos",
    "submit FRC videos",
    "FIRST media upload",
    "FRC media submission",
    "robotics media upload",
    "FIRST Robotics photos upload",
    "FIRST Robotics videos upload",
    "team media submission",
    "FRC photo archive upload",
    "FRC video archive upload",
  ],
};

function getSearchParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

function getDigitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

export default async function UploadPage({ searchParams }: UploadPageProps) {
  const params = await searchParams;
  const initialTeamNumber = getDigitsOnly(getSearchParamValue(params.team));

  return (
    <main className="fmc-surface flex-1">
      <section className="page-container py-12">
        <div className="mb-10 page-intro max-w-2xl border-l-8 border-[#F85259] bg-white/75 px-5 py-4">
          <p className="text-sm text-[#72007E]">Public uploads</p>
          <h1 className="mt-2 text-3xl text-[#17001C]">Upload</h1>
          <p className="mt-4 text-[#17001C]/80">
            Submit team media with a team number, year, and media file. FMC
            saves uploads to Google Drive, then approved clips show up in team
            search from newest to oldest year.
          </p>
        </div>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,52rem)_22rem] lg:items-start">
          <PublicMediaUpload initialTeamNumber={initialTeamNumber} />
          <div className="grid gap-8">
            <figure className="scrap-card group overflow-hidden p-3">
              <div className="relative aspect-[4/3] overflow-hidden rounded-md border-2 border-[#17001C]">
                <Image
                  alt="Robot detail seen through clear polycarbonate"
                  className="object-cover"
                  fill
                  priority
                  sizes="(min-width: 1024px) 22rem, 100vw"
                  src="/media/alex-5193-detail.jpg"
                />
                <span className="photo-credit">{alexCredit}</span>
              </div>
            </figure>
            <UploadLeaderboard />
          </div>
        </div>
      </section>
    </main>
  );
}
