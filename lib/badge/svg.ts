// Server-rendered "Human Made" badge as a standalone SVG.
//
// This is the asset external sites embed via `<img src=".../api/badge/[id]">`.
// It must be fully self-contained: no external fonts, no CSS dependency, no
// reference to the certificate's contents (the badge never reveals anything —
// it is just a tasteful, curiosity-piquing mark that links to /c/[id]).

export type BadgeTheme = "light" | "dark";

type Palette = {
  bg: string;
  border: string;
  ink: string;
  faint: string;
  accent: string;
};

const PALETTES: Record<BadgeTheme, Palette> = {
  // Mirrors the Living Craft palette in app/globals.css.
  light: { bg: "#FAF8F1", border: "#E2DACB", ink: "#16130F", faint: "#4A433B", accent: "#E23B2E" },
  dark: { bg: "#16130F", border: "#2E2820", ink: "#FAF8F1", faint: "#C8BFB0", accent: "#FF5FA2" },
};

// Typewriter / monospace stack — no font dependency, degrades everywhere.
const FONT = "ui-monospace, 'SFMono-Regular', 'Courier New', monospace";

const W = 280;
const H = 44;

/**
 * A tiny hand-drawn marker rainbow — concentric solid-colour arcs — drawn at
 * (x, y) in a 24px box. Self-contained: solid strokes only (no gradients/url()),
 * so the cross-site SVG stays portable.
 */
function rainbow(x: number, y: number): string {
  const arcs: [string, number][] = [
    ["#7B2FBE", 10], ["#E23B2E", 8.2], ["#FF5FA2", 6.4], ["#1EA83C", 4.6], ["#1C4FD6", 2.8],
  ];
  const paths = arcs
    .map(([c, r]) => `<path d="M${12 - r} 16 A ${r} ${r} 0 0 1 ${12 + r} 16" stroke="${c}"/>`)
    .join("");
  return `<g transform="translate(${x},${y})" fill="none" stroke-width="1.7" stroke-linecap="round">${paths}</g>`;
}

/** Build the badge SVG markup string for the given theme. */
export function renderBadgeSvg(theme: BadgeTheme = "light"): string {
  const p = PALETTES[theme];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Human Made — Download certificate">
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="6" fill="${p.bg}" stroke="${p.border}"/>
  ${rainbow(10, 8)}
  <text x="44" y="19" font-family="${FONT}" font-size="13" font-weight="700" fill="${p.ink}" letter-spacing="0.2">Human Made</text>
  <text x="44" y="34" font-family="${FONT}" font-size="10.5" fill="${p.faint}" letter-spacing="0.3">Download certificate</text>
  <circle cx="${W - 16}" cy="${H / 2}" r="3" fill="${p.accent}"/>
</svg>`;
}

export const BADGE_WIDTH = W;
export const BADGE_HEIGHT = H;
