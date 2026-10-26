import Image from "next/image";
import Link from "next/link";
import RandomTeamsPreview from "@/components/RandomTeamsPreview";
import RecentUploadsCarousel from "@/components/RecentUploadsCarousel";
import { getRecentUploadCollages } from "@/lib/recentUploads";

const discordInvite = "https://discord.gg/xCqryxThbC";

export default async function Home() {
  const recentUploads = await getRecentUploadCollages();

  return (
    <main className="fmc-surface flex-1">
      <section
        className="home-mission-section -mt-44 border-b border-[#72007E]/30 bg-black pt-44 text-white sm:-mt-32 sm:pt-32"
      >
        <div className="home-mission-media group">
          <Image
            alt="Robot detail seen through clear polycarbonate"
            className="object-cover"
            fill
            priority
            sizes="100vw"
            src="/media/alex-5193-detail.jpg"
          />
          <span className="photo-credit">{"Photo taken by FMC Member Alex on 5193."}</span>
        </div>
        <div className="home-mission-content mx-auto grid w-full max-w-6xl gap-8 px-6 py-16">
          <div>
            <div className="max-w-3xl">
              <h1 className="text-4xl text-white sm:text-5xl">
                Who are we?
              </h1>
              <p className="mt-6 text-lg leading-8 text-[#F4E7E7]">
                We are the FIRST Media Community (FMC); a community of aspiring FIRST creatives consisting of students, alumni, and mentors 
                who share ideas and create media of any variety. Not only to make it more accessible, but also 
                to help out others with their media. Our goal is to provide a space where aspiring and experienced 
                creatives can connect, share ideas, develop their skills, and collaborate on projects ranging from 
                photography and videography to graphic design, social media, and more.
              </p>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                className="font-primary fmc-button inline-flex h-11 items-center justify-center bg-[#F85259] px-5 text-sm text-white hover:bg-[#A335E6]"
                href={discordInvite}
                target="_blank"
                rel="noopener noreferrer"
              >
                Join the Discord
              </a>
              <Link
                className="font-primary fmc-button inline-flex h-11 items-center justify-center bg-[#17001C]/80 px-5 text-sm text-white hover:bg-[#72007E]"
                href="/teams"
              >
                View media drive
              </Link>
            </div>
          </div>

          <Image
            alt="FMC mascot holding a camera"
            className="home-mascot-sticker"
            height={480}
            src="/media/fmc-mascot.gif"
            unoptimized
            width={480}
          />
        </div>
      </section>

      <section className="recent-uploads-page-section">
        <div className="w-full px-6">
          <RecentUploadsCarousel
            collages={recentUploads.collages}
            totalCount={recentUploads.totalCount}
          />
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-6 px-6 py-12 md:grid-cols-3">
        <div className="scrap-card rotate-[-1deg] p-6">
          <h2 className="text-lg text-[#17001C]">Share Work</h2>
          <p className="mt-3 text-sm leading-6 text-[#17001C]/75">
            Post photos, videos, graphics, reels, recaps, and resources from
            events or team projects.
          </p>
        </div>
        <div className="scrap-card rotate-[1deg] p-6">
          <h2 className="text-lg text-[#17001C]">Learn Together</h2>
          <p className="mt-3 text-sm leading-6 text-[#17001C]/75">
            Ask questions, get feedback, trade editing tips, and build skills.
          </p>
        </div>
        <div className="scrap-card rotate-[-0.5deg] p-6">
          <h2 className="text-lg text-[#17001C]">Collaborate</h2>
          <p className="mt-3 text-sm leading-6 text-[#17001C]/75">
            Find people for event coverage, team branding, social projects, and
            commission work.
          </p>
        </div>
      </section>

      <section className="bg-[#17001C] py-14 text-white">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-6 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
          <div>
            <p className="text-sm uppercase text-[#F85259]">From the field</p>
            <h2 className="mt-2 text-3xl text-white">
              Media lives where the action is.
            </h2>
            <p className="mt-4 text-[#F4E7E7]">
              Team stories, field-side moments, and the creative
              people who make FIRST feel alive online. Get all the helpful, inspiring, 
              and behind-the-scenes content from the community.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-[1.15fr_0.85fr]">
            <figure className="group relative overflow-hidden rounded-2xl border-2 border-[#F85259]/60 bg-black shadow-[8px_8px_0_#F85259]">
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

            <figure className="group relative overflow-hidden rounded-2xl border-2 border-[#A335E6]/70 bg-black shadow-[8px_8px_0_#7137E3]">
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

      <section className="home-team-search-section">
        <div className="w-full px-6">
          <div className="mb-5 flex flex-col gap-4 border-b-4 border-[#F85259] pb-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm text-[#72007E]">FIND MEDIA</p>
              <h2 className="text-2xl text-[#17001C]">
                Search teams and find their clips
              </h2>
            </div>
            <Link className="font-primary scrap-chip rounded-md px-3 py-2 text-sm text-[#17001C]" href="/teams">
              Open teams
            </Link>
          </div>
          <RandomTeamsPreview />
        </div>
      </section>
    </main>
  );
}
