import type { Metadata } from "next";
import type { ReactNode } from "react";
import CompetitionCountdown from "@/components/competition/CompetitionCountdown";
import CompetitionUpload from "@/components/competition/CompetitionUpload";
import { currentCompetitionDeadline } from "@/lib/competition";

const logoFolderUrl =
  "https://drive.google.com/drive/folders/13VngzW8NqT3LIbwWJ2H2jEoz5tjr21Cl?usp=sharing";
const competitionDiscordUrl = "https://discord.gg/uzPvf2kMme";
const competitionPageUrl = "https://www.firstmediacommunity.org/competition";

export const metadata: Metadata = {
  title: "FRCtees x FMC Editing Contest",
  description:
    "Submit your FRC edit for the first FRCtees x FMC Editing Contest.",
};

export default function CompetitionPage() {
  const prizes = [
    { rank: "1", placement: "1st place", reward: "$175" },
    { rank: "2", placement: "2nd place", reward: "$90" },
    { rank: "3", placement: "3rd place", reward: "$45" },
    { rank: "4", placement: "4th place", reward: "$25" },
    { rank: "5", placement: "5th place", reward: "$15" },
    { rank: "6-10", placement: "6th-10th place", reward: "Honorable Mention" },
  ];
  const requirements: { id: string; content: ReactNode }[] = [
    {
      id: "frc-related",
      content: (
        <>
          The edit <strong>MUST</strong> be related to the FIRST Robotics
          Competition (FRC), but it does not have to be of a robot. It may help
          with creativity points if executed properly.
        </>
      ),
    },
    {
      id: "frctees-logo",
      content: (
        <>
          Add the <em>FRCtees</em> logo somewhere in the edit, and it must be on
          screen for a <strong>MINIMUM</strong> of half a second. Logos can be
          found{" "}
          <a
            className="font-bold text-[#72007E] underline decoration-[#F85259] underline-offset-4"
            href={logoFolderUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            HERE
          </a>
          .
        </>
      ),
    },
    {
      id: "tag-fmc",
      content:
        "Must tag @first.media.community when submitting on Instagram/TikTok, or @FIRSTmediacommunity if submitted on YouTube.",
    },
    {
      id: "submissions-open",
      content: (
        <>
          Submissions will open a week before the deadline on the{" "}
          <a
            className="font-bold text-[#72007E] underline decoration-[#F85259] underline-offset-4"
            href={competitionPageUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            FMC Website
          </a>
          .
        </>
      ),
    },
  ];
  const judging = [
    "We will judge based on creativity, effort, and execution, with each being ranked on a 1-10 scale. A perfect score would be 30 points.",
    "There will be multiple judges, including FMC admin, FRCtees, and a few other FRC editors.",
    "Judging will take place immediately after the deadline.",
  ];
  const info: { id: string; content: ReactNode }[] = [
    {
      id: "clips",
      content: <strong>FRC clips can be found in clips.</strong>,
    },
    {
      id: "one-edit",
      content: (
        <>
          Can post <strong>1 edit MAX</strong>.
        </>
      ),
    },
    {
      id: "song",
      content: "Any song is allowed.",
    },
    {
      id: "prizes",
      content: (
        <>
          Prizes can be claimed through{" "}
          <strong>
            PayPal, Apple Cash, bank transfer, Visa gift card, Cash App, Venmo,
            Revolut, Interac (Canada), and Wise international wire
            (international)
          </strong>
          .
        </>
      ),
    },
  ];

  return (
    <main className="fmc-surface flex-1">
      <section className="mx-auto w-full max-w-[96rem] px-6 py-12">
        <div className="competition-hero fmc-dark-halftone">
          <div className="competition-hero-glow" aria-hidden="true" />
          <div className="max-w-3xl">
            <p className="text-sm uppercase text-[#F85259]">
              Welcome to the first ever
            </p>
            <h1 className="mt-3 text-4xl text-white sm:text-5xl">
              FRCtees x FMC Editing Contest
            </h1>
            <p className="mt-5 text-base leading-7 text-[#F4E7E7] sm:text-lg">
              This editing contest is brought to you by FRCtees and the FIRST
              Media Community. Make an FRC edit, submit it, and compete for a
              $350 prize pool.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a
                className="font-primary fmc-button inline-flex h-11 items-center justify-center bg-[#F85259] px-5 text-sm text-white hover:bg-[#A335E6]"
                href="#competition-submit"
              >
                Submit edit
              </a>
              <a
                className="font-primary fmc-button inline-flex h-11 items-center justify-center bg-[#17001C] px-5 text-sm text-white hover:bg-[#72007E]"
                href={competitionDiscordUrl}
                rel="noopener noreferrer"
                target="_blank"
              >
                Join Discord
              </a>
            </div>
          </div>
          <div className="competition-prize-badge" aria-label="$350 prize pool">
            <span>$350</span>
            <small>Prize Pool</small>
          </div>
        </div>

        <section className="scrap-card competition-prize-card mt-8 p-4 sm:p-5">
          <div className="competition-leaderboard-deadline">
            <div>
              <p className="text-sm uppercase text-[#72007E]">Deadline</p>
              <h2 className="mt-2 text-2xl text-[#17001C]">
                Due September 7, 2026
              </h2>
            </div>
            <CompetitionCountdown deadline={currentCompetitionDeadline} />
          </div>

          <div className="mt-6 border-t-4 border-[#F85259] pt-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm text-[#72007E]">Prize leaderboard</p>
                <h2 className="mt-1 text-lg text-[#17001C]">Rewards</h2>
              </div>
              <span className="rounded-md border-2 border-[#17001C] bg-[#F4E7E7] px-3 py-1 text-xs font-semibold text-[#17001C]">
                $350 pool
              </span>
            </div>
            <ol className="competition-prize-list mt-5 grid gap-3">
              {prizes.map((prize) => (
                <li className="competition-prize-row" key={prize.rank}>
                  <span className="competition-prize-rank">{prize.rank}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-[#17001C]">
                      {prize.placement}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="competition-prize-reward">
                      {prize.reward}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <section className="scrap-card p-5">
            <h2 className="text-lg text-[#17001C]">Requirements</h2>
            <ul className="mt-4 grid gap-3 text-sm leading-6 text-[#17001C]/75">
              {requirements.map((requirement) => (
                <li key={requirement.id}>{requirement.content}</li>
              ))}
            </ul>
          </section>

          <section className="scrap-card p-5">
            <h2 className="text-lg text-[#17001C]">Judging</h2>
            <ul className="mt-4 grid gap-3 text-sm leading-6 text-[#17001C]/75">
              {judging.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="scrap-card p-5">
            <h2 className="text-lg text-[#17001C]">Info</h2>
            <ul className="mt-4 grid gap-3 text-sm leading-6 text-[#17001C]/75">
              {info.map((item) => (
                <li key={item.id}>{item.content}</li>
              ))}
            </ul>
            <a
              className="font-primary fmc-button mt-5 inline-flex h-10 items-center justify-center bg-[#F85259] px-4 text-sm text-white hover:bg-[#A335E6]"
              href={competitionDiscordUrl}
              rel="noopener noreferrer"
              target="_blank"
            >
              Contest Discord
            </a>
          </section>
        </div>

        <section className="mt-8" id="competition-submit">
          <CompetitionUpload />
        </section>
      </section>
    </main>
  );
}
