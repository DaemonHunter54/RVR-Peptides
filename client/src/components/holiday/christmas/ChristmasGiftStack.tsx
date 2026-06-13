/** Small present stack beside product images. */
export function ChristmasGiftStack({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 52" className={className} aria-hidden>
      <defs>
        <filter id="gift-shadow">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.2" />
        </filter>
      </defs>
      <g filter="url(#gift-shadow)">
        {/* Back gift */}
        <rect x="8" y="18" width="22" height="18" rx="2" fill="#166534" />
        <rect x="17" y="18" width="4" height="18" fill="#dc2626" />
        <rect x="8" y="25" width="22" height="4" fill="#dc2626" />
        <path d="M17 18 C17 12 22 10 19 6 C16 10 17 12 17 18" fill="#dc2626" />
        {/* Front gift */}
        <rect x="28" y="24" width="26" height="22" rx="2" fill="#b91c1c" />
        <rect x="40" y="24" width="4" height="22" fill="#fcd34d" />
        <rect x="28" y="33" width="26" height="4" fill="#fcd34d" />
        <path d="M40 24 C40 16 46 14 42 8 C38 14 40 16 40 24" fill="#fcd34d" />
        {/* Small gift */}
        <rect x="36" y="8" width="16" height="14" rx="1.5" fill="#2563eb" />
        <rect x="43" y="8" width="3" height="14" fill="#fff" opacity="0.85" />
        <rect x="36" y="14" width="16" height="2.5" fill="#fff" opacity="0.85" />
      </g>
    </svg>
  );
}
