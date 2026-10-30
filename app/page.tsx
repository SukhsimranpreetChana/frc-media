import Image from "next/image";
import Link from "next/link";
import MediaWall from "@/components/MediaWall";
import RandomTeamsPreview from "@/components/RandomTeamsPreview";
import RecentUploadsCarousel from "@/components/RecentUploadsCarousel";
import { getHomeMedia, type MediaStats } from "@/lib/recentUploads";

// Rebuild every 5 minutes so new uploads and stats show without a redeploy.
export const revalidate = 300;

function formatCount(value: number) {
  return value.toLocaleString("en-US");
}

function MediaStatsRow({ stats }: { stats: MediaStats }) {
  const items = [
    { value: stats.files, label: "photos & videos" },
    { value: stats.teams, label: "teams featured" },
    { value: stats.creators, label: "creators" },
  ];

  return (
    <dl className="mt-10 grid max-w-md grid-cols-3 gap-4 xl:max-w-xl border-t border-[#72007E]/30 pt-6">
      {items.map((item) => (
        <div key={item.label}>
          <dt className="sr-only">{item.label}</dt>
          <dd className="font-primary text-2xl text-white sm:text-3xl">
            {formatCount(item.value)}
          </dd>
          <dd className="mt-1 text-sm text-[#F4E7E7]/85">{item.label}</dd>
        </div>
      ))}
    </dl>
  );
}

export default async function Home() {
  const homeMedia = await getHomeMedia();

  return (
    <main className="fmc-surface flex-1">
      <section className="home-hero border-y border-[#72007E]/30 bg-black text-white">
        <div className="page-container home-hero__content grid gap-10 py-14 lg:py-16">
          <div>
            <h1 className="text-[2rem] leading-tight text-white sm:text-5xl">
              Who are we?
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#F4E7E7] xl:max-w-3xl">
              We&apos;re the FIRST Media Community (FMC): students, alumni, and
              mentors who share ideas and create media of every kind, from
              photography and video to graphic design and social media.
              Explore what the community has captured, or share your own.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                className="font-primary fmc-button fmc-button--primary inline-flex h-11 items-center justify-center whitespace-nowrap px-5 text-sm"
                href="/upload"
              >
                Upload media
              </Link>
              <Link
                className="font-primary fmc-button fmc-button--secondary inline-flex h-11 items-center justify-center whitespace-nowrap px-5 text-sm"
                href="/teams"
              >
                Browse teams
              </Link>
            </div>

            {homeMedia.stats.files > 0 ? (
              <MediaStatsRow stats={homeMedia.stats} />
            ) : null}
          </div>

          <MediaWall collages={homeMedia.wallCollages} />
        </div>
      </section>

      <section className="page-container pt-10">
        <RecentUploadsCarousel
          collages={homeMedia.collages}
          totalCount={homeMedia.totalCount}
        />
      </section>

      <section className="page-container py-12">
        <div className="section-heading">
          <h2 className="text-2xl text-[#17001C]">Get involved</h2>
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <div className="scrap-card scrap-card--taped rotate-[-1deg] p-6">
            <h3 className="text-lg text-[#17001C]">Share Work</h3>
            <p className="mt-3 text-sm leading-6 text-[#17001C]/85">
              Post photos, videos, graphics, reels, recaps, and resources from
              events or team projects.
            </p>
          </div>
          <div className="scrap-card scrap-card--taped rotate-[1deg] p-6">
            <h3 className="text-lg text-[#17001C]">Learn Together</h3>
            <p className="mt-3 text-sm leading-6 text-[#17001C]/85">
              Ask questions, get feedback, trade editing tips, and build skills.
            </p>
          </div>
          <div className="scrap-card scrap-card--taped rotate-[-0.5deg] p-6">
            <h3 className="text-lg text-[#17001C]">Collaborate</h3>
            <p className="mt-3 text-sm leading-6 text-[#17001C]/85">
              Find people for event coverage, team branding, social projects,
              and commission work.
            </p>
          </div>
        </div>
      </section>

      <section className="border-y border-[#72007E]/30 bg-[#17001C] py-14 text-white">
        <div className="page-container grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-[#F85259]">
              From the field
            </p>
            <h2 className="mt-2 text-3xl text-white">
              Media lives where the action is.
            </h2>
            <p className="mt-4 leading-7 text-[#F4E7E7]">
              Team stories, field-side moments, and the creative
              people who make FIRST feel alive online. Get all the helpful, inspiring,
              and behind-the-scenes content from the community.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-[1.15fr_0.85fr]">
            <figure className="photo-frame group">
              <div className="relative aspect-[17/9] overflow-hidden">
                <Image
                  alt="FIRST event floor with teams and spectators"
                  className="object-cover"
                  fill
                  sizes="(min-width: 1024px) 48vw, 100vw"
                  src="/media/event-overview.png"
                />
                <span className="photo-credit">{"Photo taken by FMC Member Sukh on 2056."}</span>
              </div>
            </figure>

            <figure className="photo-frame group">
              <div className="relative aspect-[17/9] h-full min-h-48 overflow-hidden sm:aspect-auto">
                <Image
                  alt="FIRST Robotics field with game pieces in motion"
                  className="object-cover"
                  fill
                  sizes="(min-width: 1024px) 34vw, 100vw"
                  src="/media/alex-5193-field.jpg"
                />
                <span className="photo-credit">{"Photo taken by FMC Member Alex on 5193."}</span>
              </div>
            </figure>
          </div>
        </div>
      </section>

      <section className="page-container pb-16 pt-12">
        <div className="section-heading flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-[#72007E]">
              Find media
            </p>
            <h2 className="mt-1 text-2xl text-[#17001C]">
              Search teams and find their clips
            </h2>
          </div>
          <Link
            className="font-primary fmc-button fmc-button--secondary inline-flex h-10 items-center justify-center px-4 text-sm"
            href="/teams"
          >
            Open teams
          </Link>
        </div>
        <div className="mt-6">
          <RandomTeamsPreview />
        </div>
      </section>
    </main>
  );
}
