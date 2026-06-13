import { useMemo } from "react";
import { cn } from "@/lib/utils";

type Flake = {
  id: number;
  left: number;
  delay: number;
  duration: number;
  size: number;
  opacity: number;
  drift: number;
};

function buildFlakes(count: number, seed: number): Flake[] {
  return Array.from({ length: count }, (_, i) => {
    const n = (i * 9301 + seed * 49297) % 233280;
    const r = (x: number) => ((n * x + i * 17 + seed) % 1000) / 1000;
    return {
      id: i,
      left: r(1) * 100,
      delay: r(2) * 8,
      duration: 7 + r(3) * 6,
      size: 2 + r(4) * 3.5,
      opacity: 0.35 + r(5) * 0.45,
      drift: (r(6) - 0.5) * 40,
    };
  });
}

/** Snow confined to a section — scrolls with the page, not a fixed overlay. */
export function SectionSnowfall({
  density = 36,
  seed = 1,
  className,
}: {
  density?: number;
  seed?: number;
  className?: string;
}) {
  const flakes = useMemo(() => buildFlakes(density, seed), [density, seed]);

  return (
    <div className={cn("absolute inset-0 pointer-events-none overflow-hidden z-[1]", className)} aria-hidden>
      {flakes.map((flake) => (
        <span
          key={flake.id}
          className="absolute rounded-full bg-white animate-snowfall"
          style={{
            left: `${flake.left}%`,
            top: "-4%",
            width: flake.size,
            height: flake.size,
            opacity: flake.opacity,
            animationDelay: `${flake.delay}s`,
            animationDuration: `${flake.duration}s`,
            boxShadow: flake.size > 3.5 ? "0 0 4px rgba(255,255,255,0.5)" : undefined,
            ["--snow-drift" as string]: `${flake.drift}px`,
          }}
        />
      ))}
    </div>
  );
}
