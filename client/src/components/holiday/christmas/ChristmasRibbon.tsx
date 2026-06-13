type RibbonVariant = "corner" | "sale";

/** Corner ribbon overlay for product cards. */
export function ChristmasRibbon({ variant = "corner" }: { variant?: RibbonVariant }) {
  if (variant === "sale") {
    return (
      <div className="absolute top-0 right-0 z-30 pointer-events-none w-16 h-16 overflow-hidden" aria-hidden>
        <div
          className="absolute top-3 -right-6 w-24 text-center text-[9px] font-bold tracking-wider text-white py-0.5 shadow-md"
          style={{
            background: "linear-gradient(135deg, #b91c1c 0%, #dc2626 100%)",
            transform: "rotate(45deg)",
          }}
        >
          HOLIDAY
        </div>
      </div>
    );
  }

  return (
    <div className="absolute -top-1 -right-1 z-30 pointer-events-none w-14 h-14" aria-hidden>
      <svg viewBox="0 0 56 56" className="w-full h-full drop-shadow-sm">
        <path d="M0 0 L56 0 L56 28 Q28 32 0 28 Z" fill="#b91c1c" />
        <path d="M0 0 L56 0 L56 12 L0 8 Z" fill="#dc2626" opacity="0.85" />
        <path
          d="M28 28 C32 34 36 38 28 48 C20 38 24 34 28 28"
          fill="#166534"
          stroke="#14532d"
          strokeWidth="0.5"
        />
        <ellipse cx="28" cy="26" rx="5" ry="3" fill="#eab308" opacity="0.9" />
        <path d="M8 6 L48 6" stroke="#fcd34d" strokeWidth="1.2" opacity="0.6" strokeDasharray="3 2" />
      </svg>
    </div>
  );
}
