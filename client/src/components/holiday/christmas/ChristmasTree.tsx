/** Illustrated Christmas tree — section-anchored, not a floating emoji. */
export function ChristmasTree({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 160"
      className={className}
      aria-hidden
      role="img"
    >
      <defs>
        <linearGradient id="rvr-tree-green" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1a5c32" />
          <stop offset="100%" stopColor="#0d3d21" />
        </linearGradient>
        <filter id="rvr-tree-shadow" x="-20%" y="-10%" width="140%" height="130%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000" floodOpacity="0.25" />
        </filter>
      </defs>
      <g filter="url(#rvr-tree-shadow)">
        {/* Trunk */}
        <rect x="52" y="128" width="16" height="22" rx="2" fill="#5c3d1e" />
        {/* Layers */}
        <polygon points="60,8 18,72 102,72" fill="url(#rvr-tree-green)" />
        <polygon points="60,28 14,88 106,88" fill="#1e6b38" />
        <polygon points="60,48 10,108 110,108" fill="url(#rvr-tree-green)" />
        <polygon points="60,68 8,128 112,128" fill="#1a5c32" />
        {/* Star */}
        <polygon
          points="60,2 63,10 72,10 65,15 68,24 60,19 52,24 55,15 48,10 57,10"
          fill="#fcd34d"
          stroke="#f59e0b"
          strokeWidth="0.5"
        />
        {/* Ornaments */}
        {[
          [42, 58, "#dc2626"],
          [78, 62, "#2563eb"],
          [55, 78, "#eab308"],
          [68, 88, "#dc2626"],
          [38, 95, "#2563eb"],
          [82, 98, "#eab308"],
          [58, 108, "#dc2626"],
          [72, 118, "#2563eb"],
        ].map(([cx, cy, fill], i) => (
          <circle key={i} cx={cx} cy={cy} r="4.5" fill={String(fill)} stroke="#fff" strokeWidth="0.8" opacity="0.95" />
        ))}
        {/* Garland swoops */}
        <path
          d="M22 78 Q40 88 60 82 T98 78"
          fill="none"
          stroke="#fcd34d"
          strokeWidth="1.5"
          opacity="0.85"
        />
        <path
          d="M16 108 Q38 118 60 112 T104 108"
          fill="none"
          stroke="#fcd34d"
          strokeWidth="1.5"
          opacity="0.85"
        />
      </g>
    </svg>
  );
}
