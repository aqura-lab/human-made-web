// The "Human Made" badge as a React element. Styling is fully self-contained
// (inline styles + a monospace/typewriter stack) so it renders identically
// inside this app and reads correctly as a conceptual embed, without depending
// on globals.css. For true cross-site embeds, writers use the SVG image route
// (/api/badge/[id]) wrapped in a link — see components/dashboard/BadgeEmbed.

import Link from "next/link";

type Theme = "light" | "dark";

const PALETTES: Record<Theme, { bg: string; border: string; ink: string; faint: string; accent: string }> = {
  light: { bg: "#FAF8F1", border: "#E2DACB", ink: "#16130F", faint: "#4A433B", accent: "#E23B2E" },
  dark: { bg: "#16130F", border: "#2E2820", ink: "#FAF8F1", faint: "#C8BFB0", accent: "#FF5FA2" },
};

const FONT = 'ui-monospace, "SFMono-Regular", "Courier New", monospace';

// A tiny hand-drawn marker rainbow — concentric solid-colour arcs.
function Rainbow() {
  const arcs: [string, number][] = [
    ["#7B2FBE", 10], ["#E23B2E", 8.2], ["#FF5FA2", 6.4], ["#1EA83C", 4.6], ["#1C4FD6", 2.8],
  ];
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" style={{ flex: "0 0 auto" }}>
      <g fill="none" strokeWidth="1.7" strokeLinecap="round">
        {arcs.map(([c, r]) => (
          <path key={c} d={`M${12 - r} 16 A ${r} ${r} 0 0 1 ${12 + r} 16`} stroke={c} />
        ))}
      </g>
    </svg>
  );
}

export function HumanMadeBadge({
  id,
  theme = "light",
  label = "Download certificate",
}: {
  id: string;
  theme?: Theme;
  label?: string;
}) {
  const p = PALETTES[theme];
  return (
    <Link
      href={`/c/${id}`}
      aria-label={`Human Made — ${label}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 14px",
        background: p.bg,
        border: `1px solid ${p.border}`,
        borderRadius: 6,
        textDecoration: "none",
        fontFamily: FONT,
        lineHeight: 1.15,
      }}
    >
      <Rainbow />
      <span style={{ display: "flex", flexDirection: "column" }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: p.ink, letterSpacing: "0.02em" }}>
          Human Made
        </span>
        <span style={{ fontSize: 10.5, color: p.faint, letterSpacing: "0.03em" }}>{label}</span>
      </span>
      <span
        aria-hidden="true"
        style={{ width: 6, height: 6, borderRadius: "50%", background: p.accent, marginLeft: 4 }}
      />
    </Link>
  );
}
