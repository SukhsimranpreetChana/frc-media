import AdminGate from "@/components/AdminGate";

export default function AdminPage() {
  return (
    <main className="flex-1 bg-zinc-50">
      <section className="mx-auto w-full max-w-6xl px-6 py-12">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-zinc-500">Admin</p>
          <h1 className="mt-2 text-3xl font-bold text-zinc-950">
            Content management
          </h1>
          <p className="mt-4 text-zinc-700">
            This placeholder can later become the private dashboard for adding
            clips, teams, commissions, and drive links.
          </p>
        </div>

        <AdminGate />
      </section>
    </main>
  );
}
