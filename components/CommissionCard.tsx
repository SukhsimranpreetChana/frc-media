import type { Commission } from "@/types";

type CommissionCardProps = {
  commission: Commission;
};

export default function CommissionCard({ commission }: CommissionCardProps) {
  return (
    <article className="fmc-dark-halftone flex flex-col gap-4 rounded-2xl border-2 border-[#F85259]/50 p-5 text-white shadow-[0_10px_0_rgba(23,0,28,0.22)]">
      <div>
        <p className="scrap-chip inline-flex rounded-md px-3 py-1 text-sm text-[#17001C]">
          {commission.costRange}
        </p>
        <h3 className="mt-4 text-xl text-white">{commission.title}</h3>
      </div>
      <a
        className="font-primary fmc-button mt-auto inline-flex h-11 items-center justify-center bg-[#F85259] px-4 text-sm text-white hover:bg-[#A335E6]"
        href={commission.link}
        target="_blank"
        rel="noopener noreferrer"
      >
        View commission
      </a>
    </article>
  );
}
