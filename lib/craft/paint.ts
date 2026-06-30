// Pure helpers for the cursor paint trail and selection highlight. No DOM here —
// the marker-rainbow logic lives in one tested place.

export const TRAIL_INKS = [
  "#7B2FBE", "#E23B2E", "#FF5FA2", "#1EA83C",
  "#1C4FD6", "#29A3E0", "#FF7A18", "#FFD21E",
] as const;

// Selection paints WHITE text (var(--paper)) on the highlight, so each ink must
// clear WCAG AA (>=4.5:1) against near-white. The bright trail reds/pinks/greens
// don't, so selection uses darker variants of the same marker hues (purple and
// blue are already dark enough and are reused verbatim). The light trail inks
// (yellow/orange/sky) are never used for selection.
// Contrast vs #FAF8F1: dark-red 5.5, purple 6.6, dark-pink 6.2, dark-green 6.3, blue 6.3.
export const SELECTION_INKS = [
  "#B91C1C", "#7B2FBE", "#BE185D", "#166534", "#1C4FD6",
] as const;

export type Medium = "pencil" | "watercolour" | "oil";
export const MEDIA: Medium[] = ["pencil", "watercolour", "oil"];

function wrapIndex(i: number, n: number): number {
  // Indices are non-negative incrementing counters in practice; a negative
  // index is a defensive case and clamps to the first ink (not a wrap-around).
  const t = Math.trunc(i);
  return t < 0 ? 0 : t % n;
}

export function nextPaintColor(index: number, inks: readonly string[] = TRAIL_INKS): string {
  return inks[wrapIndex(index, inks.length)];
}

export function pickMedium(seed: number): Medium {
  return MEDIA[wrapIndex(seed, MEDIA.length)];
}

export type BrushParams = { width: number; alpha: number; jitter: number; blur: number };

export function brushParams(medium: Medium): BrushParams {
  switch (medium) {
    case "pencil":
      return { width: 2, alpha: 0.9, jitter: 1.2, blur: 0 };
    case "watercolour":
      return { width: 11, alpha: 0.26, jitter: 0.5, blur: 3 };
    case "oil":
      return { width: 7, alpha: 1, jitter: 0.25, blur: 0 };
  }
}

export function trailEnabled(opts: { finePointer: boolean; reducedMotion: boolean }): boolean {
  return opts.finePointer && !opts.reducedMotion;
}
