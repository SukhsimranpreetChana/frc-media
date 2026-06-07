const collaborationRequestUrl = "https://discord.gg/VAZAtjwweN";

const collaborations = [
  {
    id: "rtmpjWaiFHY",
    title: "The Rebuilt Recap",
    url: "https://www.youtube.com/watch?v=rtmpjWaiFHY",
  },
  {
    id: "tCHCyic7X9Q",
    title: "The Reefscape Recap",
    url: "https://www.youtube.com/watch?v=tCHCyic7X9Q&t=1s",
  },
  {
    id: "aDsBINcdTII",
    title: "2056 2026 Recap Video",
    url: "https://www.youtube.com/watch?v=aDsBINcdTII&t=17s",
  },
];

export default function CollaborationsShowcase() {
  return (
    <section className="mt-12">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b-4 border-[#7137E3] pb-3">
        <div>
          <p className="text-sm text-[#72007E]">Collaborations</p>
          <h2 className="text-2xl text-[#17001C]">
            Request a collab or browse existing ones
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <p className="rounded-md bg-[#F85259] px-3 py-1 text-sm text-white">
            Prices may vary
          </p>
          <a
            className="font-primary fmc-button inline-flex h-10 items-center justify-center bg-[#7137E3] px-4 text-sm text-white hover:bg-[#A335E6]"
            href={collaborationRequestUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            Request a collaboration
          </a>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {collaborations.map((collaboration) => (
          <article
            className="scrap-card flex h-full flex-col overflow-hidden p-0"
            key={collaboration.id}
          >
            <a
              className="block"
              href={collaboration.url}
              rel="noopener noreferrer"
              target="_blank"
            >
              <div className="aspect-video overflow-hidden bg-[#17001C]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt=""
                  className="h-full w-full object-cover transition duration-300 hover:scale-105"
                  src={`https://img.youtube.com/vi/${collaboration.id}/hqdefault.jpg`}
                />
              </div>
            </a>
            <div className="flex flex-1 flex-col p-5">
              <p className="scrap-chip inline-flex w-fit rounded-md px-2 py-1 text-sm text-[#17001C]">
                YouTube Collab
              </p>
              <h3 className="mt-3 text-lg leading-tight text-[#17001C]">
                {collaboration.title}
              </h3>
              <a
                className="font-primary fmc-button mt-auto inline-flex h-10 items-center justify-center bg-[#F85259] px-4 text-sm text-white hover:bg-[#A335E6]"
                href={collaboration.url}
                rel="noopener noreferrer"
                target="_blank"
              >
                Watch collab
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
