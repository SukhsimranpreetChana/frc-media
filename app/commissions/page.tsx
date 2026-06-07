import CommissionsBoard from "@/components/CommissionsBoard";

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
            Browse posted commission options from the community. Ask an admin if you want to post your own commission or have any questions about the process.
          </p>
        </div>

        <CommissionsBoard />
      </section>
    </main>
  );
}
