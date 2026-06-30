# Living Craft — Design-System Overhaul & Delightful UX

**Date:** 2026-06-30
**Repo:** `human-made-web`
**Status:** Approved design, pending implementation plan
**Branch:** `feat/living-craft-redesign`

## Context

Human Made's web platform currently wears a restrained "editorial / analog-typewriter"
skin: warm paper (`#f3efe6`), ink, a single editorial-red accent, with Playfair Display +
Newsreader + JetBrains Mono. It is tasteful but quiet. Before going live to production we
want a **bold, playful, crafty, colourful** identity that makes the first impression
delightful and surprising — in the spirit of [penname.co](https://penname.co/about/) — while
staying credible on the trust-critical surfaces.

The brand anchor is the **hand-drawn marker rainbow logo**. Its eight marker inks become
the palette, and the signature interactions literally bring the logo to life: a cursor that
paints a rainbow trail in different media, a text-selection highlight that paints in bold
contrast, and a hero that types its way from "AI" to "human made".

This is a **design + UX** overhaul. No business logic, data model, or API changes. The
existing 87 Jest tests and 12 Playwright E2E tests must stay green.

## Design decisions (approved)

1. **Scope:** the new design *system* applies app-wide for consistency; the heaviest
   *theatrics* (giant animated hero) live on public/marketing surfaces. Authed utility
   screens get the same look but calm.
2. **Colour strategy:** *ink on paper, rainbow as craft.* Base is black ink on warm paper
   with big bold type; colour is the living craft layer (logo, cursor trail, selection,
   link/hover marks, numerals, status stamps), each cycling the marker palette. Restraint
   makes the colour pop.
3. **Hero:** a *brand-statement* hero — a typewriter types `AI`, backspaces to empty, then
   types `human made`.
4. **Logo:** the marker rainbow is the brandmark; the palette derives from it.

## Design tokens

### Palette — the eight marker inks
```
--mk-purple #7B2FBE   --mk-red    #E23B2E   --mk-pink   #FF5FA2   --mk-green  #1EA83C
--mk-blue   #1C4FD6   --mk-sky    #29A3E0   --mk-orange #FF7A18   --mk-yellow #FFD21E
```
The rainbow rotation order (for trail / selection / numerals) follows the logo's arcs:
purple → red → pink → green → blue → sky → orange → yellow, then repeats.

### Base
```
--paper   #FAF8F1   (brighter, "white paper" feel; subtle grain retained)
--paper-2 #F1ECdf
--panel   #FFFFFF    (white "sheet" cards)
--ink     #16130F
--ink-soft #4A433B
--ink-faint #8A8073
--rule    #E2DACB
```
`--accent` is no longer a single fixed red; components reference specific marker inks or the
rotating `--paint` custom property. Red (`--mk-red`) remains the default selection/primary
for the Pen-Name "red moment".

### Status colours (kept distinguishable, never colour-only)
`--ok` = `--mk-green`, `--bad` = `--mk-red`, `--warn` = `--mk-orange`. Always paired with a
label and/or icon so meaning never relies on hue alone.

### Typography — two voices
- **Anton** (`next/font/google`) → `--font-display`: heavy condensed grotesque for hero,
  page titles, section headers. The "BIG BOLD BLACK" voice.
- **Courier Prime** (`next/font/google`) → `--font-type`: clean, legible typewriter for all
  body, labels, buttons, inputs, tables, dashboard. Delivers "typewriter on white paper"
  everywhere.

This replaces Playfair Display, Newsreader, and JetBrains Mono entirely.

## Signature interactions

Three global client components, mounted once in `app/layout.tsx`. Each has a pure helper
module in `lib/craft/` that is unit-tested without a DOM.

### 1. Cursor paint trail — `components/craft/CursorPaint.tsx`
A fixed, full-viewport `<canvas>` with `pointer-events: none` and a high `z-index` overlay.
On `pointermove` it records points and renders a fading trail that:
- **cycles the rainbow** — each new stroke segment advances the paint colour;
- **varies the medium** — `pencil` (thin, grainy, slight jitter), `watercolour` (soft,
  translucent, bleeding edges), `oil` (thick, opaque, textured) — chosen with bounded
  randomness so it reads hand-made, not mechanical;
- **fades** over ~0.6–1.0s (alpha decay per frame).

Performance & a11y:
- `requestAnimationFrame`-driven; points capped; auto-pauses on `document.hidden`.
- Enabled only for **fine pointer + hover** devices (`matchMedia("(pointer:fine)")`); no
  trail on touch.
- Disabled entirely under `prefers-reduced-motion: reduce`.

Pure helper `lib/craft/paint.ts`: `nextPaintColor(index)` (deterministic rotation),
`pickMedium(seed)` (bounded random medium), brush parameter tables. Unit-tested.

### 2. Text-selection paint — `components/craft/SelectionPaint.tsx`
`::selection { background: var(--paint-selection); color: var(--paper); }` gives a bold
contrast highlight (the Pen-Name red-on-white moment). On each `selectionchange` that starts
a new selection, the component rotates `--paint-selection` to the next marker ink via
`document.documentElement.style.setProperty`. Default before any selection: `--mk-red`.
Under `prefers-reduced-motion`, the colour stays fixed at `--mk-red` (no rotation), still
bold.

**Contrast:** selection paints white text, so it rotates only the **contrast-safe subset**
that meets AA against white — `purple, red, pink, green, blue` (a dedicated
`SELECTION_INKS` list, distinct from the full eight-ink trail rotation). The light inks
(`yellow, orange, sky`) are reserved for the cursor trail, where they sit on paper and the
text underneath is unaffected.

### 3. Hero typewriter — `components/craft/Typewriter.tsx`
Drives the headline: type `AI` → hold → backspace to empty → type `human made` → caret
blinks. The element's **semantic text is the final string** ("human made") rendered
server-side, so SEO, screen readers, and the no-JS path all get the real headline; the
animation is a visual layer that takes over on mount.
- `prefers-reduced-motion`: render the final "human made" immediately, no animation.
- Pure helper `lib/craft/typewriter.ts`: a state-machine/timeline generator that, given the
  script `["AI", "", "human made"]` and timing config, yields the sequence of displayed
  strings. Unit-tested deterministically.

### Delight backlog (optional, tasteful — include as time allows)
- Rainbow logo "draws itself" on first load (SVG stroke-dashoffset animation).
- Marker-stroke underline on link hover.
- Rainbow numerals on the "how it works" steps.
- A small paint-stamp flourish on signup success (wraps the existing copy, never replaces it).

## Page-by-page treatment

- **Landing (`app/page.tsx`)** — full-bleed Anton hero with the typewriter animation, a tight
  value-prop line + lede, restyled signup, rainbow-numeral steps, restyled footer. Maximum
  theatrics.
- **Verify (`app/c/[id]/page.tsx`)** — trust-critical: calm, credible, legible. Apply the
  type system and colour, but the verdict becomes a bold **marker "stamp"** (green pass /
  red fail) that keeps its icon + text label (never colour-only). This page is large (200
  lines) and was just added by the badge PR; restyle in place, do not restructure its logic.
- **Login (`app/login/page.tsx`)** — bold, minimal, typewriter.
- **Dashboard / community / admin / account** — same system (Anton headings, Courier Prime
  body, paper, selection, cursor trail, rainbow accents: dashboard bignum in marker ink,
  rainbow progress bar) but **calm**: no giant hero animation, dense screens stay usable.

## The embeddable badge — make it on-brand

The badge (merged in PR #2) is the mark that appears on *other people's published work*, so
it must be unmistakably Human Made. Today it uses the **old** palette and a fountain-pen-nib
motif. Bring it onto the new brand:

- Replace the **nib** with a small **rainbow-arc mark** drawn as inline SVG paths.
- Update the palette to the new tokens (paper `#FAF8F1`, ink `#16130F`; dark theme refreshed
  to match).
- Apply to **both** copies: `lib/badge/svg.ts` (the cross-site SVG) and
  `components/badge/HumanMadeBadge.tsx` (the in-app React element). Keep them visually
  identical.

**Hard constraints for the embeddable SVG** (it ships to third-party sites):
- **Self-contained:** no external fonts (keep the `ui-monospace, "Courier New", monospace`
  stack — already a typewriter voice and on-brand), no `@import`, no `url(...)`, no
  `xlink:href`. The rainbow arcs therefore use **solid stroke/fill marker colours, not
  gradients** (which also matches the hand-drawn marker look). `tests/unit/badge.test.ts`
  enforces these — keep them green.
- **Same dimensions** (`BADGE_WIDTH` 280 × `BADGE_HEIGHT` 44) and the strings "Human Made" /
  "Download certificate" (asserted by tests).
- The two colour-literal assertions in `badge.test.ts` (`#f3efe6`, `#1b1714`) and the route
  test's `#1b1714` reference the old palette — **update them in lockstep** to the new tokens.

## Guardrails (non-negotiable)

- **`prefers-reduced-motion: reduce`** disables the cursor trail, freezes the selection
  colour, and renders the hero's final text without animation. No looping motion remains.
- **Performance:** the trail is rAF-throttled, fine-pointer/hover-only, and pauses on hidden
  tabs. No layout thrash; the canvas never blocks input (`pointer-events: none`).
- **Accessibility:** AA contrast for ink-on-paper and for selection (white on marker ink);
  status never colour-alone; visible focus rings (marker-style); the hero headline is real
  DOM text.
- **Tests stay green.** This work is CSS + new client components + className/markup
  restyling; **business logic, data model, and APIs are untouched.** The existing E2E and
  component tests assert on roles, labels, and copy ("Request early access", "check your
  inbox", "we read every note", "Promote", upvote names). **Preserve every tested string and
  accessible name, or update the test in the same change.** New pure logic (paint rotation,
  medium pick, typewriter timeline) gets its own unit tests.

## Where the code lands

| Area | Files |
|------|-------|
| Fonts + global mounts | `app/layout.tsx` (swap fonts; mount `CursorPaint`, `SelectionPaint`) |
| Tokens + component styles | `app/globals.css` (rebuilt) |
| New client components | `components/craft/CursorPaint.tsx`, `SelectionPaint.tsx`, `Typewriter.tsx` |
| New pure helpers (unit-tested) | `lib/craft/paint.ts`, `lib/craft/typewriter.ts` |
| Badge on-brand | `lib/badge/svg.ts`, `components/badge/HumanMadeBadge.tsx`, `tests/unit/badge.test.ts` |
| Page restyles (markup/classes only) | `app/page.tsx`, `app/c/[id]/page.tsx`, `app/login/page.tsx`, `app/dashboard/page.tsx`, `app/community/page.tsx`, `app/admin/page.tsx`, `app/account/page.tsx`, `components/Chrome.tsx`, and the dashboard/admin/community components |

## Testing

- **Unit (Jest):** `nextPaintColor` rotation (deterministic, wraps at 8), `pickMedium`
  (returns a valid medium; bounded/seeded), typewriter timeline (script →
  `["A","AI","A","","h","hu",… ,"human made"]`-shaped sequence and terminal state), and the
  reduced-motion branch (mock `matchMedia` → component renders final text / mounts no canvas).
- **Badge unit tests:** updated colour literals; self-containment assertions
  (`!@import`, `!url(`, `!xlink:href`) and dimensions/strings remain.
- **Regression:** full `npm test` (Jest), `npm run test:e2e` (Playwright, 12), `npm run
  build`, `npm run lint` — all green. E2E may need selector touch-ups only if a tested
  accessible name changes; default is to preserve names so no E2E edits are needed.
- **Manual visual review:** run locally (`npm run dev`) and confirm the hero animation,
  cursor trail across media, selection rotation, badge render, and reduced-motion fallback.

## Out of scope

- Any change to authentication, data model, queue/referral/release/community logic, or APIs.
- New copy/messaging strategy (we keep the existing value proposition; only the hero headline
  gains the animated "AI → human made" treatment, with the real value-prop line beneath).
- Vercel production deployment (sequenced immediately after this redesign).
