type CreditRequiredBadgeProps = {
  compact?: boolean;
};

export default function CreditRequiredBadge({
  compact = false,
}: CreditRequiredBadgeProps) {
  return (
    <div className="inline-flex items-center gap-2 rounded-md border-2 border-black bg-[#FFD43B] px-3 py-2 text-xs font-bold text-black">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt=""
        className="h-5 w-5 shrink-0"
        src="/warningSymbol.png"
      />
      <span>
        {compact
          ? "Credit required"
          : "This clip requires credit to be given"}
      </span>
    </div>
  );
}
