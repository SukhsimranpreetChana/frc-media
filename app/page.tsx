import Link from "next/link";
import TeamCard from "@/components/TeamCard";
import { featuredTeams } from "@/lib/search";

const discordInvite = "https://discord.gg/xCqryxThbC";
const iceDriveFolder = "https://icedrive.net/s/Z4F8bBxaRiFNPZCiz7DXDQPby8Vx";

export default function Home() {
  return (
    <main className="flex-1 bg-[#F4E7E7]">
      <section
        className="border-b border-[#72007E]/30 bg-black bg-contain bg-center bg-no-repeat text-white"
        style={{ backgroundImage: "url('/blackboard.jpg')" }}
      >
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-16">
          <div className="max-w-3xl">
            <h1 className="text-4xl text-white sm:text-5xl">
              A home base for aspiring FIRST creatives.
            </h1>
            <p className="mt-6 text-lg leading-8 text-[#F4E7E7]">
              We are a community of students, alumni, and mentors who share
              ideas and create media of any variety. Our goal is to make media
              more accessible, help others improve their work, and connect
              creatives across photography, videography, graphic design, social
              media, and more.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              className="font-primary inline-flex h-11 items-center justify-center rounded-md bg-[#F85259] px-5 text-sm text-white hover:bg-[#A335E6]"
              href={discordInvite}
              target="_blank"
              rel="noopener noreferrer"
            >
              Join the Discord
            </a>
            <a
              className="font-primary inline-flex h-11 items-center justify-center rounded-md border border-[#A335E6] bg-transparent px-5 text-sm text-white hover:bg-[#72007E]"
              href={iceDriveFolder}
              target="_blank"
              rel="noopener noreferrer"
            >
              View media drive
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-6 px-6 py-12 md:grid-cols-3">
        <div className="rounded-lg border border-[#72007E]/20 bg-white p-6">
          <h2 className="text-lg text-[#17001C]">Share Work</h2>
          <p className="mt-3 text-sm leading-6 text-[#17001C]/75">
            Post photos, videos, graphics, reels, recaps, and resources from
            events or team projects.
          </p>
        </div>
        <div className="rounded-lg border border-[#72007E]/20 bg-white p-6">
          <h2 className="text-lg text-[#17001C]">Learn Together</h2>
          <p className="mt-3 text-sm leading-6 text-[#17001C]/75">
            Ask questions, get feedback, trade editing tips, and build skills
            with creatives who understand FIRST.
          </p>
        </div>
        <div className="rounded-lg border border-[#72007E]/20 bg-white p-6">
          <h2 className="text-lg text-[#17001C]">Collaborate</h2>
          <p className="mt-3 text-sm leading-6 text-[#17001C]/75">
            Find people for event coverage, team branding, social projects, and
            commission work.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 pb-16">
        <div className="max-w-3xl">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm text-[#72007E]">Find media</p>
              <h2 className="text-2xl text-[#17001C]">
                Search teams and find their clips
              </h2>
            </div>
            <Link className="font-primary text-sm text-[#7137E3]" href="/teams">
              Open teams
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {featuredTeams.slice(0, 2).map((team) => (
              <TeamCard key={team.id} team={team} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
