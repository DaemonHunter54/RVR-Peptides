import { useMemo } from "react";

const BULB_COLORS = ["#ef4444", "#22c55e", "#eab308", "#3b82f6", "#f97316", "#ec4899"];

/** Navbar-bottom garland with lit bulbs — spans the header width. */
export function ChristmasGarland() {
  const bulbs = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        id: i,
        x: 1.8 + i * 3.5,
        color: BULB_COLORS[i % BULB_COLORS.length],
        delay: (i * 0.15) % 2,
        size: i % 3 === 0 ? 5 : 4,
      })),
    []
  );

  return (
    <div className="absolute bottom-0 left-0 right-0 h-5 pointer-events-none overflow-visible z-[60]" aria-hidden>
      <svg viewBox="0 0 100 12" preserveAspectRatio="none" className="w-full h-full">
        <path
          d="M0 4 Q12 10 25 4 T50 6 T75 3 T100 5"
          fill="none"
          stroke="#166534"
          strokeWidth="0.6"
          opacity="0.9"
        />
        {bulbs.map((bulb) => (
          <g key={bulb.id} transform={`translate(${bulb.x}, ${4 + (bulb.id % 2) * 1.2})`}>
            <line x1="0" y1="-2" x2="0" y2="0" stroke="#374151" strokeWidth="0.3" />
            <circle
              cx="0"
              cy="2"
              r={bulb.size / 10}
              fill={bulb.color}
              className="animate-twinkle"
              style={{ animationDelay: `${bulb.delay}s`, transformOrigin: "center" }}
            />
            <circle cx="0" cy="1.6" r={bulb.size / 20} fill="#fff" opacity="0.45" />
          </g>
        ))}
      </svg>
    </div>
  );
}
