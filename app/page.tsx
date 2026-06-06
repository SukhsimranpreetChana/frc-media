import Link from "next/link";
import TeamCard from "@/components/TeamCard";
import { featuredTeams } from "@/lib/search";

const discordInvite = "https://discord.gg/xCqryxThbC";
const iceDriveFolder = "https://icedrive.net/s/Z4F8bBxaRiFNPZCiz7DXDQPby8Vx";

export default function Home() {
  return (
    <main className="flex-1 bg-zinc-50">
      <section className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-16">
          <div className="max-w-3xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-red-700">
              FIRST Media Community
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-zinc-950 sm:text-5xl">
              A home base for aspiring FIRST creatives.
            </h1>
            <p className="mt-6 text-lg leading-8 text-zinc-700">
              We are a community of students, alumni, and mentors who share
              ideas and create media of any variety. Our goal is to make media
              more accessible, help others improve their work, and connect
              creatives across photography, videography, graphic design, social
              media, and more.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              className="inline-flex h-11 items-center justify-center rounded-md bg-zinc-950 px-5 text-sm font-semibold text-white hover:bg-zinc-800"
              href={discordInvite}
              target="_blank"
              rel="noopener noreferrer"
            >
              Join the Discord
            </a>
            <a
              className="inline-flex h-11 items-center justify-center rounded-md border border-zinc-300 bg-white px-5 text-sm font-semibold text-zinc-950 hover:bg-zinc-100"
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
        <div className="rounded-lg border border-zinc-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-zinc-950">Share Work</h2>
          <p className="mt-3 text-sm leading-6 text-zinc-600">
            Post photos, videos, graphics, reels, recaps, and resources from
            events or team projects.
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-zinc-950">Learn Together</h2>
          <p className="mt-3 text-sm leading-6 text-zinc-600">
            Ask questions, get feedback, trade editing tips, and build skills
            with creatives who understand FIRST.
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-zinc-950">Collaborate</h2>
          <p className="mt-3 text-sm leading-6 text-zinc-600">
            Find people for event coverage, team branding, social projects, and
            commission work.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 pb-16">
        <div className="max-w-3xl">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-zinc-500">Find media</p>
              <h2 className="text-2xl font-semibold text-zinc-950">
                Search teams and find their clips
              </h2>
            </div>
            <Link className="text-sm font-semibold text-red-700" href="/teams">
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
