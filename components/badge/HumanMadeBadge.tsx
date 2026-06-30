// The "Human Made" badge as a React element. Styling is fully self-contained
// (inline styles + a monospace/typewriter stack) so it renders identically
// inside this app and reads correctly as a conceptual embed, without depending
// on globals.css. For true cross-site embeds, writers use the SVG image route
// (/api/badge/[id]) wrapped in a link — see components/dashboard/BadgeEmbed.

import Link from "next/link";

type Theme = "light" | "dark";

const PALETTES: Record<Theme, { bg: string; border: string; ink: string; faint: string; accent: string }> = {
  light: { bg: "#f3efe6", border: "#d7cfbe", ink: "#1b1714", faint: "#534b42", accent: "#ab2b1e" },
  dark: { bg: "#1b1714", border: "#3a332c", ink: "#f3efe6", faint: "#c8bfb0", accent: "#e0594a" },
};

const FONT = 'ui-monospace, "SFMono-Regular", "Courier New", monospace';

function Nib({ accent, bg }: { accent: string; bg: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" style={{ flex: "0 0 auto" }}>
      <path d="M12 2 C15 2 18 6 18 12 L12 22 L6 12 C6 6 9 2 12 2 Z" fill={accent} />
      <line x1="12" y1="9" x2="12" y2="20" stroke={bg} strokeWidth="1.4" strokeLinecap="round" opacity="0.85" />
      <circle cx="12" cy="11" r="1.6" fill={bg} />
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
      <Nib accent={p.accent} bg={p.bg} />
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
