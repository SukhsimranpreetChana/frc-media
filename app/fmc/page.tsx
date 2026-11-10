import type { Metadata } from "next";
import Image from "next/image";
import latest from "@/public/fmc/latest.json";

export const metadata: Metadata = {
  title: "FMC Toolkit | FIRST Media Community",
  description:
    "Download FMC, the FIRST Media Community toolkit of plugins for After Effects, Premiere Pro, Photoshop, Illustrator, Blender, DaVinci Resolve, OBS, Figma and Affinity.",
  keywords: [
    "FMC",
    "FMC toolkit",
    "FIRST Media Community plugins",
    "FRC After Effects plugin",
    "FRC Premiere Pro plugin",
    "FRC Photoshop plugin",
    "FRC Illustrator plugin",
    "FRC Blender add-on",
    "FRC DaVinci Resolve",
    "FRC OBS overlays",
    "FRC livestream overlays",
    "FRC Figma plugin",
    "robotics team media tools",
    "FRC motion graphics",
  ],
};

type App = {
  name: string;
  needs: string;
  what: string;
  isNew?: boolean;
  note?: string;
};

const apps: App[] = [
  {
    name: "After Effects",
    needs: "2022 or newer",
    what: "The FMC panel: easing curves, speed ramps, 60 text animations, 187 transitions, titles, elements, liquid glass, looks and one-click tools, plus FMC's 18 native effects.",
  },
  {
    name: "Premiere Pro",
    needs: "25.6 or newer",
    what: "Easing, speed ramps, cut transitions, motion, 77 looks on FMC's effects, sounds, 166 .mogrt graphics and editing tools like Beat Montage and vertical copies.",
  },
  {
    name: "Photoshop",
    needs: "2025 or newer (filters: 2026)",
    what: "Templates in your brand kit, 46 layer styles, text effects, looks, social-size export, and FMC's After Effects effects as Photoshop filters.",
  },
  {
    name: "Illustrator",
    needs: "FMC Tools: 2026",
    what: "Number lockups, stickers, pit signs and posters, vector styles, print and tee tools, axo assembly drawings, and FMC Tools for the toolbar.",
  },
  {
    name: "Blender",
    needs: "4.2 or newer",
    what: "3D team numbers and logos in your colors, robot CAD prep, materials, exploded views, camera moves and a render queue.",
  },
  {
    name: "DaVinci Resolve",
    needs: "21 or newer, free or Studio",
    what: "FMC's 18 effects and 16 transitions as OpenFX, Fusion and FRC titles, LUT looks, timeline scripts and a Studio panel.",
    isNew: true,
  },
  {
    name: "OBS Studio",
    needs: "30 or newer",
    what: "The FMC Livestream scene collection: scoreboard, match timer, lower thirds, team intros and stingers, run from the FMC Control dock.",
    isNew: true,
  },
  {
    name: "Figma",
    needs: "Figma desktop app",
    what: "The FMC panel in Figma and FigJam: 128 presets and 86 tools, with your brand kit as Figma variables.",
    isNew: true,
    note: "Not on the Figma Community yet: you import it once from the files FMC Setup copies.",
  },
  {
    name: "Affinity",
    needs: "3.3 or newer",
    what: "FMC Filters, 49 templates, styles and graphics libraries, 31 LUT looks and palettes from your brand kit.",
    isNew: true,
  },
  {
    name: "Camera Raw & Lightroom",
    needs: "Camera Raw, Lightroom Classic or Lightroom",
    what: "FMC's 31 colour looks as creative profiles, each with an Amount slider, for photos straight from the event.",
    isNew: true,
  },
  {
    name: "Canva",
    needs: "Coming later",
    what: "FMC for Canva is built and tested, but Canva apps run from Canva's servers.",
    note: "Not in the Canva Apps Marketplace yet, so it isn't part of this download.",
  },
];

const whatsNew = [
  {
    title: "FMC for DaVinci Resolve",
    body: "FMC's 18 effects and 16 transitions as OpenFX, 19 Fusion titles, 4 HTML FRC titles (Match Result, Team Intro, Alliance Lineup, Countdown), generators, effect stacks, 22 LUT looks, scripts for project setup, match markers, Shorts and YouTube renders, and an FMC panel in Resolve Studio.",
  },
  {
    title: "FMC for OBS",
    body: "A ready-made FMC Livestream scene collection with branded overlays (red and blue scoreboard, match timer, lower thirds, team intro and award cards, Up Next, sponsors, polls, Starting Soon and BRB screens, stingers) and the FMC Control dock to run the show, with 33 hotkeys. No OBS plug-ins needed.",
  },
  {
    title: "FMC for Figma",
    body: "The FMC panel in Figma and FigJam: templates, styles, text effects, generators, icons and Creative Commons photos, axo and colour tools, and your brand kit as Figma variables.",
  },
  {
    title: "FMC for Affinity",
    body: "FMC Filters under Pixel > Filters > Plugins > FMC, 49 templates converted from FMC for Photoshop and Illustrator, library documents, 31 LUT looks, the FMC palette and one from your brand kit.",
  },
  {
    title: "FMC looks for Camera Raw and Lightroom",
    body: "FMC's 31 looks as creative profiles in an “FMC” group in the Profile Browser, for Photoshop's Camera Raw Filter, Lightroom Classic and Lightroom.",
  },
  {
    title: "One setup for everything",
    body: "FMC Setup and the Mac package now cover all of these. Each part is ticked when its app is on the computer, and running the setup again updates or removes parts.",
  },
];

function formatReleaseDate(value: string) {
  return new Date(`${value}T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export default function FmcPage() {
  const releaseDate = formatReleaseDate(latest.released);

  return (
    <main className="fmc-surface flex-1">
      <section className="home-hero border-y border-[#72007E]/30 bg-black text-white">
        <div className="page-container grid gap-10 py-14 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center lg:py-16">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-[#F85259]">
              Free toolkit for FRC team media
            </p>
            <h1 className="mt-2 text-[2rem] leading-tight text-white sm:text-5xl">
              FMC {latest.version}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#F4E7E7]">
              FMC is FIRST Media Community&apos;s set of plugins for the apps
              your media team already uses. Animate, edit, design, stream and
              grade with presets, effects and templates built around FRC, all
              in your team&apos;s colours from one shared brand kit.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                className="font-primary fmc-button fmc-button--primary inline-flex h-11 items-center justify-center whitespace-nowrap px-5 text-sm"
                href={latest.files.windows}
              >
                Download for Windows
              </a>
              <a
                className="font-primary fmc-button fmc-button--secondary inline-flex h-11 items-center justify-center whitespace-nowrap px-5 text-sm"
                href={latest.files.mac}
              >
                Download for Mac
              </a>
            </div>

            <dl className="mt-10 flex max-w-xl flex-wrap gap-x-12 gap-y-4 border-t border-[#72007E]/30 pt-6">
              <div>
                <dt className="text-sm text-[#F4E7E7]/85">Version</dt>
                <dd className="font-primary mt-1 whitespace-nowrap text-xl text-white sm:text-2xl">
                  {latest.version}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-[#F4E7E7]/85">Released</dt>
                <dd className="font-primary mt-1 whitespace-nowrap text-xl text-white sm:text-2xl">
                  <time dateTime={latest.released}>{releaseDate}</time>
                </dd>
              </div>
            </dl>
            <p className="mt-6 text-sm text-[#F4E7E7]/85">
              For Windows, and macOS 11 or newer.{" "}
              <a
                className="underline decoration-[#F85259] underline-offset-4 hover:text-white"
                href="#install"
              >
                How to install
              </a>
              {" · "}
              <a
                className="underline decoration-[#F85259] underline-offset-4 hover:text-white"
                href="#whats-new"
              >
                What&apos;s new
              </a>
            </p>
          </div>

          <figure className="photo-frame flex items-center justify-center bg-[#17001C] p-6 sm:p-10">
            <Image
              alt="FMC, FIRST Media Community"
              className="h-auto w-full max-w-lg object-contain"
              height={1080}
              priority
              sizes="(min-width: 1024px) 40vw, 90vw"
              src="/fmc-logo.png"
              width={2120}
            />
          </figure>
        </div>
      </section>

      <section className="page-container py-12">
        <div className="section-heading">
          <h2 className="text-2xl text-[#17001C]">Works with your apps</h2>
        </div>
        <p className="mt-4 max-w-3xl text-[#17001C]/80">
          One download installs FMC into every supported app it finds on your
          computer. Pick the parts you want; anything you don&apos;t have is
          skipped.
        </p>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {apps.map((app) => (
            <div className="scrap-card flex flex-col p-6" key={app.name}>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg text-[#17001C]">{app.name}</h3>
                {app.isNew ? (
                  <span className="inline-flex rotate-[-2deg] rounded-md bg-[#F85259] px-2 py-0.5 text-xs text-white">
                    New in 2.0
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-sm text-[#72007E]">{app.needs}</p>
              <p className="mt-3 text-sm leading-6 text-[#17001C]/85">
                {app.what}
              </p>
              {app.note ? (
                <p className="scrap-chip mt-4 w-fit rounded-md px-2 py-1 text-xs leading-5 text-[#17001C]">
                  {app.note}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section
        className="scroll-mt-8 border-y border-[#72007E]/30 bg-[#17001C] py-14 text-white"
        id="whats-new"
      >
        <div className="page-container">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#F85259]">
            FMC {latest.version}
          </p>
          <h2 className="mt-2 text-3xl text-white">What&apos;s new in 2.0</h2>
          <p className="mt-4 max-w-3xl leading-7 text-[#F4E7E7]">
            FMC moves beyond Adobe and Blender, with four new apps and FMC&apos;s
            looks for photo editing.
          </p>
          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {whatsNew.map((item) => (
              <div className="media-card p-6" key={item.title}>
                <h3 className="text-lg text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#F4E7E7]/85">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="page-container scroll-mt-8 pb-16 pt-12" id="install">
        <div className="section-heading">
          <h2 className="text-2xl text-[#17001C]">Installing FMC</h2>
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="page-intro border-l-8 border-[#F85259] bg-white/75 px-5 py-4">
            <h3 className="text-lg text-[#17001C]">Windows</h3>
            <p className="mt-3 text-sm leading-6 text-[#17001C]/85">
              Close your Adobe apps, DaVinci Resolve, OBS and Affinity, then run
              FMC Setup and follow the wizard. Choose All users so it can add
              FMC&apos;s effects to your apps&apos; plug-in folders. To update,
              run the new version&apos;s setup; to uninstall, use Settings &gt;
              Apps.
            </p>
          </div>
          <div className="page-intro border-l-8 border-[#F85259] bg-white/75 px-5 py-4">
            <h3 className="text-lg text-[#17001C]">Mac</h3>
            <p className="mt-3 text-sm leading-6 text-[#17001C]/85">
              FMC isn&apos;t signed by Apple yet, so the Mac installer runs
              through Terminal. Unzip the download, quit your apps, open
              Terminal, type <code className="font-mono">bash</code> and a
              space, drag &ldquo;Install FMC (Mac).command&rdquo; into the
              window and press Return. Enter your Mac password if it asks. The
              Read Me in the download has every step, including how to
              uninstall.
            </p>
          </div>
          <div className="page-intro border-l-8 border-[#F85259] bg-white/75 px-5 py-4 lg:col-span-2">
            <h3 className="text-lg text-[#17001C]">Figma and Canva</h3>
            <p className="mt-3 text-sm leading-6 text-[#17001C]/85">
              FMC for Figma and FMC for Canva aren&apos;t on the Figma Community
              or the Canva Apps Marketplace yet. FMC Setup copies FMC for Figma
              to Documents/FMC/FMC-Figma; in the Figma desktop app, open a
              design file and choose Plugins &gt; Development &gt; Import plugin
              from manifest once. FMC for Canva will follow when it&apos;s
              listed on Canva.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
