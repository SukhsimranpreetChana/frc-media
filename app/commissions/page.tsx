const commissionTypes = [
  "Event photography",
  "Event videography",
  "Team branding",
  "Graphic design",
  "Social media packages",
  "Recap videos",
];

export default function CommissionsPage() {
  return (
    <main className="flex-1 bg-zinc-50">
      <section className="mx-auto w-full max-w-6xl px-6 py-12">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-zinc-500">Coming soon</p>
          <h1 className="mt-2 text-3xl font-bold text-zinc-950">
            Commissions
          </h1>
          <p className="mt-4 text-zinc-700">
            This page is ready to be edited later with request forms, pricing,
            creator availability, and project guidelines.
          </p>
        </div>

        <div className="mt-8 rounded-lg border border-zinc-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-zinc-950">
            Possible commission categories
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {commissionTypes.map((type) => (
              <li
                className="rounded-md border border-zinc-200 px-4 py-3 text-sm text-zinc-700"
                key={type}
              >
                {type}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
