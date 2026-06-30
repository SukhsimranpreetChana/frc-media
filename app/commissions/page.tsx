import type { Metadata } from "next";
import CollaborationsShowcase from "@/components/CollaborationsShowcase";
import CommissionsBoard from "@/components/CommissionsBoard";

export const metadata: Metadata = {
  title: "Commissions | FIRST Media Community",
  description:
    "Browse FIRST and FRC media commission options from community creators.",
  keywords: [
    "FRC media commissions",
    "FIRST media commissions",
    "robotics photography commissions",
    "robotics videography commissions",
    "FRC graphic design",
    "FRC social media design",
    "FIRST Robotics media services",
    "team branding commissions",
    "robotics team branding",
    "FRC video editing",
    "FRC photo editing",
    "FIRST creative services",
    "FMC",
    "First Media Community",
    "FIRST"
  ],
};

export default function CommissionsPage() {
  return (
    <main className="fmc-surface flex-1">
      <section className="mx-auto w-full max-w-6xl px-6 py-12">
        <div className="max-w-2xl border-l-8 border-[#F85259] bg-white/75 px-5 py-4">
          <p className="text-sm text-[#72007E]">Community board</p>
          <h1 className="mt-2 text-3xl text-[#17001C]">
            Commissions
          </h1>
          <p className="mt-4 text-[#17001C]/75">
            Browse posted commission options from the community, or request to
            add your own commission for admin review.
          </p>
        </div>

        <CollaborationsShowcase />
        <div className="mb-6 mt-12 border-b-4 border-[#F85259] pb-3">
          <h2 className="text-2xl text-[#17001C]">
            Request an individual commission
          </h2>
        </div>
        <CommissionsBoard />
      </section>
    </main>
  );
}
