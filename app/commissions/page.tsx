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
    <main className="flex-1 bg-[#F4E7E7]">
      <section className="mx-auto w-full max-w-6xl px-6 py-12">
        <div className="max-w-2xl">
          <p className="text-sm text-[#72007E]">Coming soon</p>
          <h1 className="mt-2 text-3xl text-[#17001C]">
            Commissions
          </h1>
          <p className="mt-4 text-[#17001C]/75">
            This page is ready to be edited later with request forms, pricing,
            creator availability, and project guidelines.
          </p>
        </div>

        <div className="mt-8 rounded-lg border border-[#72007E]/20 bg-white p-6">
          <h2 className="text-lg text-[#17001C]">
            Possible commission categories
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {commissionTypes.map((type) => (
              <li
                className="rounded-md border border-[#72007E]/20 px-4 py-3 text-sm text-[#17001C]/75"
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
