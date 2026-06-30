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
  // Mirrors the editorial / analog-typewriter palette in app/globals.css.
  light: { bg: "#f3efe6", border: "#d7cfbe", ink: "#1b1714", faint: "#534b42", accent: "#ab2b1e" },
  dark: { bg: "#1b1714", border: "#3a332c", ink: "#f3efe6", faint: "#c8bfb0", accent: "#e0594a" },
};

// Typewriter / monospace stack — no font dependency, degrades everywhere.
const FONT = "ui-monospace, 'SFMono-Regular', 'Courier New', monospace";

const W = 280;
const H = 44;

/** A small fountain-pen-nib mark — "made by hand" — drawn at (x, y) in a 24px box. */
function nib(x: number, y: number, accent: string, ink: string): string {
  return `<g transform="translate(${x},${y})">
    <path d="M12 2 C15 2 18 6 18 12 L12 22 L6 12 C6 6 9 2 12 2 Z" fill="${accent}"/>
    <line x1="12" y1="9" x2="12" y2="20" stroke="${ink}" stroke-width="1.4" stroke-linecap="round" opacity="0.85"/>
    <circle cx="12" cy="11" r="1.6" fill="${ink}"/>
  </g>`;
}

/** Build the badge SVG markup string for the given theme. */
export function renderBadgeSvg(theme: BadgeTheme = "light"): string {
  const p = PALETTES[theme];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Human Made — Download certificate">
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="6" fill="${p.bg}" stroke="${p.border}"/>
  ${nib(12, 10, p.accent, p.bg)}
  <text x="44" y="19" font-family="${FONT}" font-size="13" font-weight="700" fill="${p.ink}" letter-spacing="0.2">Human Made</text>
  <text x="44" y="34" font-family="${FONT}" font-size="10.5" fill="${p.faint}" letter-spacing="0.3">Download certificate</text>
  <circle cx="${W - 16}" cy="${H / 2}" r="3" fill="${p.accent}"/>
</svg>`;
}

export const BADGE_WIDTH = W;
export const BADGE_HEIGHT = H;
