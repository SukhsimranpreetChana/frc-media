import AdminGate from "@/components/AdminGate";

export default function AdminPage() {
  return (
    <main className="flex-1 bg-[#F4E7E7]">
      <section className="mx-auto w-full max-w-6xl px-6 py-12">
        <div className="max-w-2xl">
          <p className="text-sm text-[#72007E]">Admin</p>
          <h1 className="mt-2 text-3xl text-[#17001C]">
            Content management
          </h1>
          <p className="mt-4 text-[#17001C]/75">
            This placeholder can later become the private dashboard for adding
            clips, teams, commissions, and drive links.
          </p>
        </div>

        <AdminGate />
      </section>
    </main>
  );
}
