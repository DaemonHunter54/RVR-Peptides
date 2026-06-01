import { trpc } from "@/lib/trpc";

/**
 * HolidayDecorations renders themed decorative elements across the page
 * based on the active holiday_theme setting from the admin panel.
 * 
 * Supported themes: christmas, halloween, easter, valentines, 4thofjuly, blackfriday
 * When theme is "default" or empty, no decorations are shown.
 */
export default function HolidayDecorations() {
  const settingsQuery = trpc.settings.public.useQuery();
  const settings = settingsQuery.data || {};
  const theme = settings.holiday_theme || "default";

  if (theme === "default" || theme === "main" || !theme) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden" aria-hidden="true">
      {theme === "christmas" && <ChristmasDecorations />}
      {theme === "halloween" && <HalloweenDecorations />}
      {theme === "easter" && <EasterDecorations />}
      {theme === "valentines" && <ValentinesDecorations />}
      {theme === "4thofjuly" && <FourthOfJulyDecorations />}
      {theme === "blackfriday" && <BlackFridayDecorations />}
    </div>
  );
}

// ─── Christmas ──────────────────────────────────────────────────────────
function ChristmasDecorations() {
  return (
    <>
      {/* Snowflakes falling animation */}
      <div className="absolute inset-0">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute text-white/70 animate-snowfall"
            style={{
              left: `${Math.random() * 100}%`,
              top: `-${Math.random() * 20}%`,
              fontSize: `${Math.random() * 14 + 10}px`,
              animationDelay: `${Math.random() * 8}s`,
              animationDuration: `${Math.random() * 5 + 6}s`,
            }}
          >
            ❄
          </div>
        ))}
      </div>

      {/* Christmas trees in corners */}
      <div className="absolute top-20 left-4 text-4xl opacity-60 animate-gentle-sway">🎄</div>
      <div className="absolute top-20 right-4 text-4xl opacity-60 animate-gentle-sway" style={{ animationDelay: "1s" }}>🎄</div>
      <div className="absolute bottom-32 left-8 text-3xl opacity-50">🎄</div>
      <div className="absolute bottom-32 right-8 text-3xl opacity-50">🎄</div>

      {/* Ornaments and gifts scattered */}
      <div className="absolute top-40 left-[10%] text-2xl opacity-50 animate-float">🎁</div>
      <div className="absolute top-60 right-[15%] text-2xl opacity-50 animate-float" style={{ animationDelay: "2s" }}>🎅</div>
      <div className="absolute bottom-[40%] left-[5%] text-xl opacity-40">⭐</div>
      <div className="absolute bottom-[60%] right-[8%] text-xl opacity-40 animate-float" style={{ animationDelay: "3s" }}>🔔</div>

      {/* String lights across the top */}
      <div className="absolute top-0 left-0 right-0 flex justify-between px-4 py-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="w-3 h-3 rounded-full animate-twinkle"
            style={{
              backgroundColor: ["#ff0000", "#00ff00", "#ffff00", "#0000ff", "#ff00ff"][i % 5],
              animationDelay: `${i * 0.3}s`,
              opacity: 0.7,
            }}
          />
        ))}
      </div>
    </>
  );
}

// ─── Halloween ──────────────────────────────────────────────────────────
function HalloweenDecorations() {
  return (
    <>
      {/* Pumpkins */}
      <div className="absolute top-24 left-6 text-4xl opacity-70 animate-gentle-sway">🎃</div>
      <div className="absolute top-24 right-6 text-4xl opacity-70 animate-gentle-sway" style={{ animationDelay: "1.5s" }}>🎃</div>
      <div className="absolute bottom-40 left-[8%] text-3xl opacity-60">🎃</div>
      <div className="absolute bottom-40 right-[8%] text-3xl opacity-60">🎃</div>

      {/* Ghosts floating */}
      <div className="absolute top-[30%] left-[5%] text-3xl opacity-50 animate-float">👻</div>
      <div className="absolute top-[50%] right-[5%] text-3xl opacity-50 animate-float" style={{ animationDelay: "2s" }}>👻</div>

      {/* Bats */}
      <div className="absolute top-16 left-[20%] text-2xl opacity-60 animate-bat-fly">🦇</div>
      <div className="absolute top-12 right-[25%] text-2xl opacity-60 animate-bat-fly" style={{ animationDelay: "1s" }}>🦇</div>
      <div className="absolute top-28 left-[40%] text-xl opacity-50 animate-bat-fly" style={{ animationDelay: "2.5s" }}>🦇</div>

      {/* Spiders and webs */}
      <div className="absolute top-0 left-0 text-4xl opacity-40">🕸️</div>
      <div className="absolute top-0 right-0 text-4xl opacity-40 scale-x-[-1]">🕸️</div>
      <div className="absolute top-[20%] right-[3%] text-xl opacity-50">🕷️</div>

      {/* Skulls */}
      <div className="absolute bottom-[30%] left-[3%] text-2xl opacity-40">💀</div>
      <div className="absolute bottom-[50%] right-[3%] text-xl opacity-40">☠️</div>
    </>
  );
}

// ─── Easter ─────────────────────────────────────────────────────────────
function EasterDecorations() {
  return (
    <>
      {/* Easter bunnies */}
      <div className="absolute top-24 left-6 text-4xl opacity-70 animate-hop">🐰</div>
      <div className="absolute top-24 right-6 text-4xl opacity-70 animate-hop" style={{ animationDelay: "1s" }}>🐰</div>
      <div className="absolute bottom-[35%] right-[5%] text-3xl opacity-60 animate-hop" style={{ animationDelay: "2s" }}>🐇</div>

      {/* Easter eggs scattered */}
      <div className="absolute top-[35%] left-[4%] text-2xl opacity-60 animate-float">🥚</div>
      <div className="absolute top-[45%] right-[4%] text-2xl opacity-60 animate-float" style={{ animationDelay: "1.5s" }}>🥚</div>
      <div className="absolute bottom-[45%] left-[8%] text-xl opacity-50">🐣</div>
      <div className="absolute top-[60%] left-[3%] text-xl opacity-50 animate-float" style={{ animationDelay: "3s" }}>🌸</div>
      <div className="absolute top-[40%] right-[7%] text-xl opacity-50">🌷</div>

      {/* Spring flowers */}
      <div className="absolute bottom-32 left-4 text-3xl opacity-50">🌼</div>
      <div className="absolute bottom-32 right-4 text-3xl opacity-50">🌻</div>
      <div className="absolute bottom-[55%] left-[6%] text-2xl opacity-40">🦋</div>
      <div className="absolute top-[25%] right-[6%] text-2xl opacity-40 animate-float" style={{ animationDelay: "2.5s" }}>🦋</div>

      {/* Basket */}
      <div className="absolute bottom-[25%] left-[5%] text-3xl opacity-50">🧺</div>
    </>
  );
}

// ─── Valentine's Day ────────────────────────────────────────────────────
function ValentinesDecorations() {
  return (
    <>
      {/* Floating hearts */}
      {Array.from({ length: 15 }).map((_, i) => (
        <div
          key={i}
          className="absolute animate-heart-float"
          style={{
            left: `${Math.random() * 100}%`,
            bottom: `-5%`,
            fontSize: `${Math.random() * 16 + 12}px`,
            animationDelay: `${Math.random() * 8}s`,
            animationDuration: `${Math.random() * 6 + 5}s`,
            opacity: Math.random() * 0.4 + 0.2,
          }}
        >
          {["❤️", "💕", "💖", "💗", "💘"][i % 5]}
        </div>
      ))}

      {/* Cupid arrows */}
      <div className="absolute top-[30%] left-[4%] text-2xl opacity-50 animate-float">💘</div>
      <div className="absolute top-[50%] right-[4%] text-2xl opacity-50 animate-float" style={{ animationDelay: "2s" }}>💝</div>

      {/* Rose petals */}
      <div className="absolute top-20 left-[15%] text-xl opacity-40">🌹</div>
      <div className="absolute top-20 right-[15%] text-xl opacity-40">🌹</div>
      <div className="absolute bottom-[40%] left-[8%] text-lg opacity-30">🌹</div>
    </>
  );
}

// ─── 4th of July ────────────────────────────────────────────────────────
function FourthOfJulyDecorations() {
  return (
    <>
      {/* Fireworks */}
      <div className="absolute top-16 left-[10%] text-3xl opacity-60 animate-twinkle">🎆</div>
      <div className="absolute top-12 right-[10%] text-3xl opacity-60 animate-twinkle" style={{ animationDelay: "1s" }}>🎇</div>
      <div className="absolute top-24 left-[30%] text-2xl opacity-50 animate-twinkle" style={{ animationDelay: "2s" }}>✨</div>
      <div className="absolute top-20 right-[30%] text-2xl opacity-50 animate-twinkle" style={{ animationDelay: "3s" }}>🎆</div>

      {/* Flags */}
      <div className="absolute top-24 left-4 text-4xl opacity-70">🇺🇸</div>
      <div className="absolute top-24 right-4 text-4xl opacity-70">🇺🇸</div>
      <div className="absolute bottom-[35%] left-[5%] text-3xl opacity-50">🇺🇸</div>
      <div className="absolute bottom-[35%] right-[5%] text-3xl opacity-50">🇺🇸</div>

      {/* Stars */}
      <div className="absolute top-[40%] left-[3%] text-2xl opacity-50 animate-float">⭐</div>
      <div className="absolute top-[55%] right-[3%] text-2xl opacity-50 animate-float" style={{ animationDelay: "1.5s" }}>⭐</div>

      {/* Eagle */}
      <div className="absolute top-[30%] right-[6%] text-2xl opacity-40">🦅</div>
    </>
  );
}

// ─── Black Friday ───────────────────────────────────────────────────────
function BlackFridayDecorations() {
  return (
    <>
      {/* Sale tags */}
      <div className="absolute top-24 left-4 text-3xl opacity-70 animate-gentle-sway">🏷️</div>
      <div className="absolute top-24 right-4 text-3xl opacity-70 animate-gentle-sway" style={{ animationDelay: "1s" }}>🏷️</div>
      <div className="absolute bottom-[40%] left-[5%] text-2xl opacity-60 animate-float">💰</div>
      <div className="absolute bottom-[40%] right-[5%] text-2xl opacity-60 animate-float" style={{ animationDelay: "2s" }}>💰</div>

      {/* Shopping bags */}
      <div className="absolute top-[35%] left-[3%] text-2xl opacity-50">🛍️</div>
      <div className="absolute top-[50%] right-[3%] text-2xl opacity-50">🛒</div>

      {/* Sparkles for excitement */}
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="absolute animate-twinkle text-yellow-400"
          style={{
            left: `${Math.random() * 90 + 5}%`,
            top: `${Math.random() * 80 + 10}%`,
            fontSize: `${Math.random() * 10 + 8}px`,
            animationDelay: `${Math.random() * 3}s`,
            opacity: Math.random() * 0.5 + 0.2,
          }}
        >
          ✨
        </div>
      ))}

      {/* Percentage signs */}
      <div className="absolute top-[25%] left-[8%] text-xl font-bold text-yellow-500/40 animate-float">%</div>
      <div className="absolute top-[60%] right-[8%] text-xl font-bold text-yellow-500/40 animate-float" style={{ animationDelay: "1.5s" }}>%</div>
    </>
  );
}
