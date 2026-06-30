# Living Craft Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-skin the Human Made web platform into the bold, playful, colourful "Living Craft" identity — marker-rainbow palette, Anton + Courier Prime type, a cursor paint trail, a rotating text-selection highlight, an "AI → human made" hero typewriter, and an on-brand embeddable badge — with zero changes to business logic, data, or APIs.

**Architecture:** A rebuilt token layer in `app/globals.css` plus two new font imports drive the whole look. Three global client components (`CursorPaint`, `SelectionPaint`, `Typewriter`) provide the signature interactions, each backed by a pure, unit-tested helper module in `lib/craft/`. Pages are restyled by swapping markup/classNames only. The badge is brought onto the new palette with an inline rainbow-arc mark while preserving its self-contained-SVG contract.

**Tech Stack:** Next.js 16 (App Router), TypeScript, `next/font/google` (Anton, Courier Prime), Canvas 2D, CSS custom properties, Jest + Testing Library (jsdom opt-in), Playwright.

## Global Constraints

- **Design + UX only.** No changes to auth, data model, queue/referral/release/community/badge *logic*, or APIs. (Badge *styling* changes; badge logic does not.)
- **Tests stay green.** The existing 87 Jest + 12 Playwright tests must pass unchanged. Preserve every tested accessible name / copy string verbatim — "Request early access", "check your inbox", "we read every note", "send feedback", "Promote", "Unpromote", upvote button names (`upvote <title>`), "delete my account", "Human Made", "Download certificate". If a tested string must change, update that test in the same task.
- **`prefers-reduced-motion: reduce`** disables the cursor trail, freezes the selection colour at `--mk-red`, and renders the hero's final text with no animation.
- **Performance:** cursor trail is `requestAnimationFrame`-driven, fine-pointer + hover only, pauses on hidden tab, and never intercepts input (`pointer-events: none`).
- **Accessibility:** AA contrast for ink-on-paper and selection (white on marker ink); status never colour-only (always icon/label); visible focus rings; hero headline is real DOM text.
- **Embeddable badge SVG is self-contained:** no external fonts, no `@import`, no `url(...)`, no `xlink:href`; rainbow drawn with solid stroke/fill marker colours (no gradients). Dimensions stay `280×44`.
- `export const runtime = "nodejs"` stays on any route that already declares it. The `@/` import alias maps to repo root. New `next/font` instances declared in `app/layout.tsx`.
- Marker palette (verbatim): `purple #7B2FBE · red #E23B2E · pink #FF5FA2 · green #1EA83C · blue #1C4FD6 · sky #29A3E0 · orange #FF7A18 · yellow #FFD21E`. Base: `paper #FAF8F1 · paper-2 #F1ECDF · panel #FFFFFF · ink #16130F · ink-soft #4A433B · ink-faint #8A8073 · rule #E2DACB`.

---

### Task 1: Foundation — fonts + token system

**Files:**
- Modify: `app/layout.tsx` (replace the three font imports; mount global craft components — components added in Tasks 4–5, so the mounts are added there, not here)
- Modify: `app/globals.css` (rebuild tokens, base, typography, and the shared component classes)

**Interfaces:**
- Produces: CSS custom properties `--mk-*`, `--paper`, `--paper-2`, `--panel`, `--ink`, `--ink-soft`, `--ink-faint`, `--rule`, `--ok`, `--warn`, `--bad`, `--paint-selection`; CSS vars `--font-display`, `--font-type`; and the class vocabulary used by later tasks: `.wrap .narrow .kicker .muted .small .display .site-header .brand .nav .site-footer .hero .hero-display .caret .lede .rule .panel .card-grid .card .num .field label input textarea .consent .btn .btn.primary .badge .badge.ok .badge.warn .badge.bad .stamp .stamp.ok .stamp.bad .error .dash-grid .span-2 .bignum .progress .code-pill .tier .lim .locked table.users .cursor-paint`.

- [ ] **Step 1: Swap fonts in `app/layout.tsx`**

Replace the existing `Playfair_Display`/`JetBrains_Mono`/`Newsreader` block with:

```tsx
import { Anton, Courier_Prime } from "next/font/google";

const display = Anton({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
});

const typewriter = Courier_Prime({
  variable: "--font-type",
  subsets: ["latin"],
  weight: ["400", "700"],
});
```

Update the `<html>` className to `` `${display.variable} ${typewriter.variable}` `` and keep `<body>{children}</body>` unchanged for now (craft mounts come in Tasks 4–5).

- [ ] **Step 2: Rebuild the top of `app/globals.css`**

Replace lines 1–69 (the `@import`, the `:root` block, the `body`/`a`/`h1,h2,h3`/`.mono,label,…` rules) with:

```css
@import "tailwindcss";

/* ─────────────────────────────────────────────────────────────
   Human Made — "Living Craft". Ink on warm paper; the eight marker
   inks of the rainbow logo are the craft layer. Big bold Anton
   display + Courier Prime typewriter body.
   ───────────────────────────────────────────────────────────── */

:root {
  --mk-purple: #7b2fbe;
  --mk-red: #e23b2e;
  --mk-pink: #ff5fa2;
  --mk-green: #1ea83c;
  --mk-blue: #1c4fd6;
  --mk-sky: #29a3e0;
  --mk-orange: #ff7a18;
  --mk-yellow: #ffd21e;

  --paper: #faf8f1;
  --paper-2: #f1ecdf;
  --panel: #ffffff;
  --ink: #16130f;
  --ink-soft: #4a433b;
  --ink-faint: #8a8073;
  --rule: #e2dacb;

  --ok: var(--mk-green);
  --warn: var(--mk-orange);
  --bad: var(--mk-red);

  /* Rotated live by SelectionPaint; default is the Pen-Name red moment. */
  --paint-selection: var(--mk-red);
}

* { box-sizing: border-box; }

html, body { padding: 0; margin: 0; min-height: 100%; }

body {
  background-color: var(--paper);
  background-image:
    radial-gradient(circle at 18% 8%, rgba(255, 255, 255, 0.7), transparent 42%),
    repeating-linear-gradient(0deg, transparent, transparent 27px, rgba(22, 19, 15, 0.014) 28px);
  color: var(--ink);
  font-family: var(--font-type), "Courier New", ui-monospace, monospace;
  font-size: 17px;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}

::selection { background: var(--paint-selection); color: var(--paper); }

a { color: var(--ink); text-decoration: underline; text-decoration-thickness: 2px; text-underline-offset: 3px; text-decoration-color: var(--mk-blue); }
a:hover { text-decoration-color: var(--mk-pink); }

h1, h2, h3 {
  font-family: var(--font-display), Impact, sans-serif;
  line-height: 0.95;
  font-weight: 400;
  letter-spacing: 0.005em;
  text-transform: uppercase;
  margin: 0 0 0.4em;
}

.display { font-family: var(--font-display), Impact, sans-serif; text-transform: uppercase; line-height: 0.9; letter-spacing: 0.01em; }

.kicker {
  font-family: var(--font-type), monospace;
  text-transform: uppercase;
  letter-spacing: 0.22em;
  font-size: 12px;
  font-weight: 700;
  color: var(--mk-red);
}
```

- [ ] **Step 3: Update the remaining component classes in `app/globals.css`**

Keep the existing class *names* (so page markup keeps working) but update their look to the new system. Apply these specific changes to the rules already in the file (lines ~71–392), leaving selectors intact:

- `.brand` → `font-family: var(--font-display); font-size: 24px; text-transform: uppercase; letter-spacing: 0.02em;` and `.brand .dot { color: var(--mk-red); }`.
- `.nav a`, `label`, `.btn`, `.badge`, `.tier`, `.code-pill`, `table.users th` → set `font-family: var(--font-type), monospace;`.
- `.hero h1` → replace with `.hero-display { font-size: clamp(56px, 12vw, 168px); max-width: 14ch; }` (giant Anton statement). Keep `.hero .lede` but set `font-size: 19px; max-width: 52ch; color: var(--ink-soft);`.
- Add the typewriter caret: `.caret { display: inline-block; width: 0.08em; min-width: 3px; height: 0.92em; margin-left: 0.06em; background: var(--mk-red); vertical-align: -0.06em; animation: caret-blink 1s steps(1) infinite; } @keyframes caret-blink { 50% { opacity: 0; } } @media (prefers-reduced-motion: reduce) { .caret { animation: none; } }`.
- `.panel` → `background: var(--panel); border: 2px solid var(--ink); border-radius: 8px; box-shadow: 4px 4px 0 rgba(22,19,15,0.12);` (bold "sheet of paper" card).
- `.card .num` → `font-family: var(--font-type); font-weight: 700;` and give each of the three `.card` numerals a marker colour via nth-of-type in the card grid: `.card-grid > .card:nth-child(1) .num { color: var(--mk-red); } .card-grid > .card:nth-child(2) .num { color: var(--mk-blue); } .card-grid > .card:nth-child(3) .num { color: var(--mk-green); }`.
- `.btn` → `border: 2px solid var(--ink); border-radius: 6px; font-weight: 700; box-shadow: 3px 3px 0 var(--ink);` and `.btn.primary { background: var(--mk-red); border-color: var(--ink); color: #fff; }` and `.btn:hover:not(:disabled) { transform: translate(-1px, -1px); box-shadow: 4px 4px 0 var(--ink); }` and `.btn:active:not(:disabled) { transform: translate(2px, 2px); box-shadow: 1px 1px 0 var(--ink); }`.
- `input/textarea:focus` → `outline: 3px solid var(--mk-blue); outline-offset: 1px; border-color: var(--ink);`.
- `.bignum` → `font-family: var(--font-display); color: var(--mk-red); font-size: 64px;`.
- `.progress > span` → `background: linear-gradient(90deg, var(--mk-purple), var(--mk-red), var(--mk-pink), var(--mk-green), var(--mk-blue), var(--mk-sky), var(--mk-orange), var(--mk-yellow));` (rainbow fill).
- Add status stamps (used by the verify page in Task 8): `.stamp { display: inline-flex; align-items: center; gap: 8px; font-family: var(--font-display); text-transform: uppercase; letter-spacing: 0.04em; font-size: 22px; padding: 6px 14px; border: 3px solid currentColor; border-radius: 8px; transform: rotate(-3deg); } .stamp.ok { color: var(--ok); } .stamp.bad { color: var(--bad); }`.
- Add the trail canvas layer: `.cursor-paint { position: fixed; inset: 0; width: 100vw; height: 100vh; pointer-events: none; z-index: 60; mix-blend-mode: multiply; }`.

- [ ] **Step 4: Verify build, lint, and existing tests are unaffected**

Run: `npm run build && npm run lint && npm test`
Expected: build compiles; lint clean; Jest 87/87 still pass (no component asserts on colours except the badge, which is untouched here).

- [ ] **Step 5: Manual visual check**

Run: `npm run dev`, open `http://localhost:3000`. Confirm: paper is brighter, headings are Anton (condensed black, uppercase), body is Courier Prime, selection highlights red. (Hero animation + trail come later.)

- [ ] **Step 6: Commit**

```bash
git add app/layout.tsx app/globals.css
git commit -m "feat(design): Living Craft token system + Anton/Courier Prime fonts"
```

---

### Task 2: Pure paint helpers — `lib/craft/paint.ts`

**Files:**
- Create: `lib/craft/paint.ts`
- Test: `tests/unit/craft-paint.test.ts`

**Interfaces:**
- Produces: `TRAIL_INKS: readonly string[]` (8 hex), `SELECTION_INKS: readonly string[]` (5 hex, AA vs white), `Medium = "pencil"|"watercolour"|"oil"`, `MEDIA: Medium[]`, `nextPaintColor(index: number, inks?: readonly string[]): string`, `pickMedium(seed: number): Medium`, `BrushParams = {width:number;alpha:number;jitter:number;blur:number}`, `brushParams(medium: Medium): BrushParams`, `trailEnabled(opts:{finePointer:boolean;reducedMotion:boolean}): boolean`.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/craft-paint.test.ts`:

```ts
import {
  TRAIL_INKS, SELECTION_INKS, MEDIA,
  nextPaintColor, pickMedium, brushParams, trailEnabled,
} from "@/lib/craft/paint";

describe("ink lists", () => {
  it("has 8 trail inks and 5 contrast-safe selection inks", () => {
    expect(TRAIL_INKS).toHaveLength(8);
    expect(SELECTION_INKS).toHaveLength(5);
    // every selection ink is one of the trail inks
    expect(SELECTION_INKS.every((c) => TRAIL_INKS.includes(c))).toBe(true);
    // the light inks are NOT used for selection (white text would fail contrast)
    expect(SELECTION_INKS).not.toContain("#FFD21E");
    expect(SELECTION_INKS).not.toContain("#FF7A18");
    expect(SELECTION_INKS).not.toContain("#29A3E0");
  });
});

describe("nextPaintColor", () => {
  it("returns inks in order and wraps at the list length", () => {
    expect(nextPaintColor(0)).toBe(TRAIL_INKS[0]);
    expect(nextPaintColor(7)).toBe(TRAIL_INKS[7]);
    expect(nextPaintColor(8)).toBe(TRAIL_INKS[0]);
    expect(nextPaintColor(9)).toBe(TRAIL_INKS[1]);
  });
  it("treats negatives and floats safely", () => {
    expect(nextPaintColor(-1)).toBe(TRAIL_INKS[0]);
    expect(nextPaintColor(2.9)).toBe(TRAIL_INKS[2]);
  });
  it("accepts a custom ink list", () => {
    expect(nextPaintColor(5, SELECTION_INKS)).toBe(SELECTION_INKS[0]);
  });
});

describe("pickMedium", () => {
  it("always returns a valid medium", () => {
    for (let s = 0; s < 12; s++) expect(MEDIA).toContain(pickMedium(s));
  });
});

describe("brushParams", () => {
  it("gives each medium a positive width and sane alpha", () => {
    for (const m of MEDIA) {
      const b = brushParams(m);
      expect(b.width).toBeGreaterThan(0);
      expect(b.alpha).toBeGreaterThan(0);
      expect(b.alpha).toBeLessThanOrEqual(1);
    }
  });
});

describe("trailEnabled", () => {
  it("only when pointer is fine AND motion is allowed", () => {
    expect(trailEnabled({ finePointer: true, reducedMotion: false })).toBe(true);
    expect(trailEnabled({ finePointer: false, reducedMotion: false })).toBe(false);
    expect(trailEnabled({ finePointer: true, reducedMotion: true })).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest craft-paint -v`
Expected: FAIL — `Cannot find module '@/lib/craft/paint'`.

- [ ] **Step 3: Write the implementation**

Create `lib/craft/paint.ts`:

```ts
// Pure helpers for the cursor paint trail and selection highlight. No DOM here —
// the marker-rainbow logic lives in one tested place.

export const TRAIL_INKS = [
  "#7B2FBE", "#E23B2E", "#FF5FA2", "#1EA83C",
  "#1C4FD6", "#29A3E0", "#FF7A18", "#FFD21E",
] as const;

// White text sits on the selection background, so selection rotates only the
// inks that meet AA against white. The light inks (yellow/orange/sky) are
// trail-only.
export const SELECTION_INKS = [
  "#E23B2E", "#7B2FBE", "#FF5FA2", "#1EA83C", "#1C4FD6",
] as const;

export type Medium = "pencil" | "watercolour" | "oil";
export const MEDIA: Medium[] = ["pencil", "watercolour", "oil"];

function wrapIndex(i: number, n: number): number {
  return ((Math.trunc(i) % n) + n) % n;
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest craft-paint -v`
Expected: PASS (all cases).

- [ ] **Step 5: Commit**

```bash
git add lib/craft/paint.ts tests/unit/craft-paint.test.ts
git commit -m "feat(craft): tested marker-paint rotation + brush helpers"
```

---

### Task 3: Pure typewriter timeline — `lib/craft/typewriter.ts`

**Files:**
- Create: `lib/craft/typewriter.ts`
- Test: `tests/unit/craft-typewriter.test.ts`

**Interfaces:**
- Produces: `buildFrames(script: string[]): string[]` — given target strings, returns every display frame (starting `""`), backspacing to the common prefix between consecutive targets then typing to the next target, with no two consecutive duplicate frames.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/craft-typewriter.test.ts`:

```ts
import { buildFrames } from "@/lib/craft/typewriter";

describe("buildFrames", () => {
  const frames = buildFrames(["AI", "", "human made"]);

  it("starts empty and ends on the final target", () => {
    expect(frames[0]).toBe("");
    expect(frames[frames.length - 1]).toBe("human made");
  });

  it("types AI, deletes back to empty, then types human made (in order)", () => {
    const at = (s: string) => frames.indexOf(s);
    expect(at("AI")).toBeGreaterThan(at("A"));
    // returns to empty AFTER showing AI, BEFORE typing the final phrase
    const emptyAfterAI = frames.indexOf("", at("AI"));
    expect(emptyAfterAI).toBeGreaterThan(at("AI"));
    expect(at("human made")).toBeGreaterThan(emptyAfterAI);
    expect(at("human")).toBeGreaterThan(emptyAfterAI);
  });

  it("never shows two identical frames back-to-back", () => {
    for (let i = 1; i < frames.length; i++) expect(frames[i]).not.toBe(frames[i - 1]);
  });

  it("only ever adds or removes one character per frame", () => {
    for (let i = 1; i < frames.length; i++) {
      expect(Math.abs(frames[i].length - frames[i - 1].length)).toBe(1);
    }
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest craft-typewriter -v`
Expected: FAIL — `Cannot find module '@/lib/craft/typewriter'`.

- [ ] **Step 3: Write the implementation**

Create `lib/craft/typewriter.ts`:

```ts
// Pure timeline for the hero typewriter. Produces the ordered display frames to
// animate between a sequence of target strings: backspace to the common prefix
// with the next target, then type up to it. One character changes per frame.

export function buildFrames(script: string[]): string[] {
  const frames: string[] = [];
  const push = (s: string) => {
    if (frames.length === 0 || frames[frames.length - 1] !== s) frames.push(s);
  };

  let current = "";
  push(current);

  for (const target of script) {
    let common = 0;
    while (
      common < current.length &&
      common < target.length &&
      current[common] === target[common]
    ) {
      common++;
    }
    for (let len = current.length - 1; len >= common; len--) push(current.slice(0, len));
    for (let len = common + 1; len <= target.length; len++) push(target.slice(0, len));
    current = target;
  }

  return frames;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest craft-typewriter -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/craft/typewriter.ts tests/unit/craft-typewriter.test.ts
git commit -m "feat(craft): tested typewriter frame timeline"
```

---

### Task 4: SelectionPaint component + mount

**Files:**
- Create: `components/craft/SelectionPaint.tsx`
- Modify: `app/layout.tsx` (mount it)
- Test: `tests/component/SelectionPaint.test.tsx`

**Interfaces:**
- Consumes: `nextPaintColor`, `SELECTION_INKS` from `@/lib/craft/paint`.
- Produces: `<SelectionPaint />` (renders nothing; sets `--paint-selection` on `documentElement` when a new selection starts; no-op under reduced motion).

- [ ] **Step 1: Write the failing test**

Create `tests/component/SelectionPaint.test.tsx`:

```tsx
/** @jest-environment jsdom */
import { render } from "@testing-library/react";
import { SelectionPaint } from "@/components/craft/SelectionPaint";
import { SELECTION_INKS } from "@/lib/craft/paint";

function mockMatchMedia(reduce: boolean) {
  window.matchMedia = jest.fn().mockImplementation((q: string) => ({
    matches: q.includes("reduce") ? reduce : false,
    media: q, addEventListener: jest.fn(), removeEventListener: jest.fn(),
    addListener: jest.fn(), removeListener: jest.fn(), onchange: null, dispatchEvent: jest.fn(),
  }));
}

function mockSelection(text: string) {
  // @ts-expect-error partial Selection is enough for the component
  document.getSelection = () => ({ isCollapsed: text.length === 0, toString: () => text });
}

afterEach(() => {
  document.documentElement.style.removeProperty("--paint-selection");
});

it("paints a contrast-safe selection ink on a new selection", () => {
  mockMatchMedia(false);
  mockSelection("hello");
  render(<SelectionPaint />);
  document.dispatchEvent(new Event("selectionchange"));
  const value = document.documentElement.style.getPropertyValue("--paint-selection");
  expect(SELECTION_INKS).toContain(value);
});

it("does nothing under reduced motion", () => {
  mockMatchMedia(true);
  mockSelection("hello");
  render(<SelectionPaint />);
  document.dispatchEvent(new Event("selectionchange"));
  expect(document.documentElement.style.getPropertyValue("--paint-selection")).toBe("");
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest SelectionPaint -v`
Expected: FAIL — `Cannot find module '@/components/craft/SelectionPaint'`.

- [ ] **Step 3: Write the implementation**

Create `components/craft/SelectionPaint.tsx`:

```tsx
"use client";

import { useEffect, useRef } from "react";
import { nextPaintColor, SELECTION_INKS } from "@/lib/craft/paint";

export function SelectionPaint() {
  const count = useRef(0);
  const had = useRef(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const onChange = () => {
      const sel = document.getSelection();
      const has = !!sel && !sel.isCollapsed && sel.toString().length > 0;
      if (has && !had.current) {
        const color = nextPaintColor(count.current++, SELECTION_INKS);
        document.documentElement.style.setProperty("--paint-selection", color);
      }
      had.current = has;
    };

    document.addEventListener("selectionchange", onChange);
    return () => document.removeEventListener("selectionchange", onChange);
  }, []);

  return null;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest SelectionPaint -v`
Expected: PASS (both cases).

- [ ] **Step 5: Mount in `app/layout.tsx`**

Import and render inside `<body>` (it renders nothing, position-independent):

```tsx
import { SelectionPaint } from "@/components/craft/SelectionPaint";
// ...
<body>
  <SelectionPaint />
  {children}
</body>
```

- [ ] **Step 6: Verify the suite still passes and the app builds**

Run: `npm test && npm run build`
Expected: Jest green (now includes SelectionPaint); build compiles.

- [ ] **Step 7: Commit**

```bash
git add components/craft/SelectionPaint.tsx app/layout.tsx tests/component/SelectionPaint.test.tsx
git commit -m "feat(craft): rotating text-selection paint highlight"
```

---

### Task 5: CursorPaint component + mount

**Files:**
- Create: `components/craft/CursorPaint.tsx`
- Modify: `app/layout.tsx` (mount it)
- Test: `tests/component/CursorPaint.test.tsx`

**Interfaces:**
- Consumes: `TRAIL_INKS`, `MEDIA`, `brushParams`, `nextPaintColor`, `pickMedium`, `trailEnabled` from `@/lib/craft/paint`.
- Produces: `<CursorPaint />` — renders a fixed `<canvas class="cursor-paint" aria-hidden>`; activates a fading rainbow trail only when `trailEnabled` is true.

- [ ] **Step 1: Write the failing test**

Create `tests/component/CursorPaint.test.tsx`:

```tsx
/** @jest-environment jsdom */
import { render } from "@testing-library/react";
import { CursorPaint } from "@/components/craft/CursorPaint";

function mockEnv({ fine, reduce }: { fine: boolean; reduce: boolean }) {
  window.matchMedia = jest.fn().mockImplementation((q: string) => ({
    matches: q.includes("reduce") ? reduce : q.includes("pointer: fine") ? fine : false,
    media: q, addEventListener: jest.fn(), removeEventListener: jest.fn(),
    addListener: jest.fn(), removeListener: jest.fn(), onchange: null, dispatchEvent: jest.fn(),
  }));
  // jsdom has no canvas 2d context; supply a stub so activation can't throw.
  HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue({
    setTransform: jest.fn(), clearRect: jest.fn(), beginPath: jest.fn(),
    moveTo: jest.fn(), lineTo: jest.fn(), stroke: jest.fn(),
  } as unknown as CanvasRenderingContext2D);
  window.requestAnimationFrame = jest.fn().mockReturnValue(1);
  window.cancelAnimationFrame = jest.fn();
}

it("always renders an aria-hidden canvas overlay", () => {
  mockEnv({ fine: true, reduce: false });
  const { container } = render(<CursorPaint />);
  const canvas = container.querySelector("canvas.cursor-paint");
  expect(canvas).not.toBeNull();
  expect(canvas?.getAttribute("aria-hidden")).toBe("true");
});

it("does not start a frame loop when motion is reduced", () => {
  mockEnv({ fine: true, reduce: true });
  render(<CursorPaint />);
  expect(window.requestAnimationFrame).not.toHaveBeenCalled();
});

it("does not start a frame loop on a coarse pointer", () => {
  mockEnv({ fine: false, reduce: false });
  render(<CursorPaint />);
  expect(window.requestAnimationFrame).not.toHaveBeenCalled();
});

it("starts the frame loop on a fine pointer with motion allowed", () => {
  mockEnv({ fine: true, reduce: false });
  render(<CursorPaint />);
  expect(window.requestAnimationFrame).toHaveBeenCalled();
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest CursorPaint -v`
Expected: FAIL — `Cannot find module '@/components/craft/CursorPaint'`.

- [ ] **Step 3: Write the implementation**

Create `components/craft/CursorPaint.tsx`:

```tsx
"use client";

import { useEffect, useRef } from "react";
import {
  TRAIL_INKS, brushParams, nextPaintColor, pickMedium, trailEnabled, type BrushParams,
} from "@/lib/craft/paint";

type Pt = { x: number; y: number; color: string; brush: BrushParams; life: number };

export function CursorPaint() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!trailEnabled({ finePointer, reducedMotion })) return;

    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const pts: Pt[] = [];
    let raf = 0;
    let stroke = 0;
    let color = nextPaintColor(stroke, TRAIL_INKS);
    let medium = pickMedium(stroke);
    let last: { x: number; y: number } | null = null;

    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const onMove = (e: PointerEvent) => {
      if (last) {
        if (Math.hypot(e.clientX - last.x, e.clientY - last.y) > 60) {
          stroke++;
          color = nextPaintColor(stroke, TRAIL_INKS);
          medium = pickMedium(stroke * 7 + 3);
        }
        pts.push({ x: e.clientX, y: e.clientY, color, brush: brushParams(medium), life: 1 });
        if (pts.length > 240) pts.splice(0, pts.length - 240);
      }
      last = { x: e.clientX, y: e.clientY };
    };

    const frame = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let k = 1; k < pts.length; k++) {
        const a = pts[k - 1];
        const b = pts[k];
        b.life -= 0.02;
        if (b.life <= 0) continue;
        ctx.globalAlpha = Math.max(0, b.brush.alpha * b.life);
        ctx.strokeStyle = b.color;
        ctx.lineWidth = b.brush.width;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.shadowBlur = b.brush.blur;
        ctx.shadowColor = b.color;
        const jx = Math.sin(k * 1.7) * b.brush.jitter;
        const jy = Math.cos(k * 1.3) * b.brush.jitter;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x + jx, b.y + jy);
        ctx.stroke();
      }
      while (pts.length && pts[0].life <= 0) pts.shift();
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      raf = window.requestAnimationFrame(frame);
    };

    const onVisibility = () => {
      if (document.hidden) {
        window.cancelAnimationFrame(raf);
        raf = 0;
      } else if (!raf) {
        raf = window.requestAnimationFrame(frame);
      }
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove);
    document.addEventListener("visibilitychange", onVisibility);
    raf = window.requestAnimationFrame(frame);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" className="cursor-paint" />;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest CursorPaint -v`
Expected: PASS (all four cases).

- [ ] **Step 5: Mount in `app/layout.tsx`**

```tsx
import { CursorPaint } from "@/components/craft/CursorPaint";
// ...
<body>
  <SelectionPaint />
  <CursorPaint />
  {children}
</body>
```

- [ ] **Step 6: Manual visual check**

Run: `npm run dev`. Move the cursor — confirm a rainbow trail that changes colour and texture and fades. In macOS System Settings → Accessibility → "Reduce motion" on, reload: no trail. Touch/trackpad-only still fine.

- [ ] **Step 7: Commit**

```bash
git add components/craft/CursorPaint.tsx app/layout.tsx tests/component/CursorPaint.test.tsx
git commit -m "feat(craft): cursor rainbow paint trail (fine-pointer, reduced-motion aware)"
```

---

### Task 6: Typewriter hero component

**Files:**
- Create: `components/craft/Typewriter.tsx`
- Test: `tests/component/Typewriter.test.tsx`

**Interfaces:**
- Consumes: `buildFrames` from `@/lib/craft/typewriter`.
- Produces: `<Typewriter className?: string />` — SSR-renders the final string "human made" (real text + `aria-label`); on mount (motion allowed) animates `AI → "" → human made` with a `.caret`.

- [ ] **Step 1: Write the failing test**

Create `tests/component/Typewriter.test.tsx`:

```tsx
/** @jest-environment jsdom */
import { render, screen, act } from "@testing-library/react";
import { Typewriter } from "@/components/craft/Typewriter";

function mockMatchMedia(reduce: boolean) {
  window.matchMedia = jest.fn().mockImplementation((q: string) => ({
    matches: q.includes("reduce") ? reduce : false,
    media: q, addEventListener: jest.fn(), removeEventListener: jest.fn(),
    addListener: jest.fn(), removeListener: jest.fn(), onchange: null, dispatchEvent: jest.fn(),
  }));
}

it("exposes the final phrase as accessible text", () => {
  mockMatchMedia(false);
  render(<Typewriter />);
  expect(screen.getByLabelText("human made")).toBeInTheDocument();
});

it("renders the final phrase immediately under reduced motion", () => {
  mockMatchMedia(true);
  const { container } = render(<Typewriter />);
  expect(container.textContent).toContain("human made");
});

it("animates to the final phrase when motion is allowed", () => {
  jest.useFakeTimers();
  mockMatchMedia(false);
  const { container } = render(<Typewriter />);
  act(() => { jest.advanceTimersByTime(8000); });
  expect(container.textContent).toContain("human made");
  jest.useRealTimers();
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest Typewriter -v`
Expected: FAIL — `Cannot find module '@/components/craft/Typewriter'`.

- [ ] **Step 3: Write the implementation**

Create `components/craft/Typewriter.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { buildFrames } from "@/lib/craft/typewriter";

const SCRIPT = ["AI", "", "human made"];
const FRAMES = buildFrames(SCRIPT);
const FINAL = SCRIPT[SCRIPT.length - 1];

export function Typewriter({ className }: { className?: string }) {
  const [i, setI] = useState(0);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setI(0);
    setAnimate(true);
  }, []);

  useEffect(() => {
    if (!animate || i >= FRAMES.length - 1) return;
    const cur = FRAMES[i];
    const next = FRAMES[i + 1];
    const delay = next === "" ? 450 : next.length < cur.length ? 55 : 115;
    const t = setTimeout(() => setI((n) => n + 1), delay);
    return () => clearTimeout(t);
  }, [animate, i]);

  const text = animate ? FRAMES[i] : FINAL;

  return (
    <span className={className} aria-label={FINAL}>
      <span aria-hidden="true">{text}</span>
      <span className="caret" aria-hidden="true" />
    </span>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest Typewriter -v`
Expected: PASS (all three cases).

- [ ] **Step 5: Commit**

```bash
git add components/craft/Typewriter.tsx tests/component/Typewriter.test.tsx
git commit -m "feat(craft): AI -> human made hero typewriter"
```

---

### Task 7: Landing page restyle

**Files:**
- Modify: `app/page.tsx`
- Reference (do not edit): `tests/e2e/*.spec.ts` (signup flow asserts "Request early access" / "check your inbox" via `SignupForm` — unchanged).

**Interfaces:**
- Consumes: `<Typewriter />` from `@/components/craft/Typewriter`; classes from Task 1.

- [ ] **Step 1: Replace the hero block markup**

In `app/page.tsx`, keep the `SiteHeader`/`SiteFooter`/`SignupForm` imports and the `searchParams` logic. Add `import { Typewriter } from "@/components/craft/Typewriter";`. Replace the `<h1>…</h1>` line inside `.hero` with the animated display headline, and tighten the kicker/lede. The hero `<div>` (left column) becomes:

```tsx
<div>
  <p className="kicker">Authorship, certified by process</p>
  <h1 className="hero-display">
    <Typewriter />
  </h1>
  <p className="lede">
    Not detected — demonstrated. A privacy-preserving authorship certificate for
    writers: capture the process behind a piece as you write it, then hand skeptics
    a certificate they can verify themselves, without ever exposing your drafts.
  </p>
  <p className="muted small">
    Built for journalists first. Your raw text stays on your device. This is not an
    AI detector — it attests to what was observed while you wrote, and is honest
    about its limits.
  </p>
</div>
```

Leave the right column (`SignupForm`) and the "How a certificate earns trust" cards section unchanged in markup — Task 1's CSS already restyles `.panel`, `.card`, `.num`.

- [ ] **Step 2: Verify the signup E2E still passes**

Run: `npm run test:e2e -- signup` (or the landing/signup spec name). If no dedicated signup spec exists, run the full E2E in Step 3.
Expected: PASS — the form copy and labels are untouched.

- [ ] **Step 3: Full E2E + build**

Run: `npm run test:e2e && npm run build`
Expected: 12/12 E2E pass; build compiles.

- [ ] **Step 4: Manual visual check**

Run: `npm run dev`. Confirm the hero types `AI`, deletes, types `human made` with a blinking caret; lede + signup read well; the three trust cards have red/blue/green numerals.

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx
git commit -m "feat(design): bold animated landing hero"
```

---

### Task 8: Verify page restyle (calm + marker stamp)

**Files:**
- Modify: `app/c/[id]/page.tsx`

**Interfaces:**
- Consumes: `.stamp .stamp.ok .stamp.bad`, type system, and `.panel` from Task 1.

- [ ] **Step 1: Read the page and locate the verdict UI**

Run: `sed -n '1,200p' app/c/[id]/page.tsx`. Identify where the pass/fail (or "verified"/"not found") verdict and the existing badge/status render.

- [ ] **Step 2: Restyle in place (markup/classNames only)**

Apply the new system without changing logic or data:
- Wrap the verdict line in a `.stamp` with `.ok` (verified) or `.bad` (failed), keeping the existing icon/word so meaning is never colour-only, e.g.:

```tsx
<span className={verified ? "stamp ok" : "stamp bad"}>
  {verified ? "✓ Verified" : "✕ Not verified"}
</span>
```

(Use the page's existing boolean; do not introduce new data.)
- Apply `.panel` to the certificate detail card(s) and `.kicker` to section labels. Page titles use `<h1>`/`<h2>` (already Anton via Task 1). Keep all certificate field text and any "Human Made" / "Download certificate" strings verbatim.

- [ ] **Step 3: Verify badge/certificate tests still pass + build**

Run: `npx jest badge && npm run build`
Expected: badge unit tests PASS (this task does not touch `lib/badge/*`); build compiles.

- [ ] **Step 4: Manual visual check**

Run: `npm run dev`, open a published certificate URL (or the not-found state). Confirm the verdict reads as a bold tilted marker stamp (green/red) with its icon+label, and the page stays calm and legible.

- [ ] **Step 5: Commit**

```bash
git add "app/c/[id]/page.tsx"
git commit -m "feat(design): calm verify page with marker verdict stamp"
```

---

### Task 9: On-brand embeddable badge

**Files:**
- Modify: `lib/badge/svg.ts`
- Modify: `components/badge/HumanMadeBadge.tsx`
- Modify: `tests/unit/badge.test.ts` (update the old-palette colour literals)

**Interfaces:**
- Produces: same exports (`renderBadgeSvg`, `BADGE_WIDTH`, `BADGE_HEIGHT`, `HumanMadeBadge`) and dimensions; new palette + rainbow-arc mark.

- [ ] **Step 1: Update the colour-literal assertions first (TDD red)**

In `tests/unit/badge.test.ts`, change the two `renderBadgeSvg` colour assertions and the route test colour assertion from the old palette to the new tokens:
- `renderBadgeSvg("dark")` toContain `#16130F` (was `#1b1714`)
- `renderBadgeSvg("light")` toContain `#FAF8F1` (was `#f3efe6`)
- route test (`getBadgeResponse`/GET) toContain `#16130F` (was `#1b1714`)

Leave the self-containment assertions (`not.toContain("@import")`, `not.toContain("url(")`, `not.toContain("xlink:href")`), the dimension assertions, and the "Human Made"/"Download certificate" assertions unchanged.

- [ ] **Step 2: Run badge tests to verify the colour cases fail**

Run: `npx jest badge -v`
Expected: FAIL on the three colour assertions (impl still emits old palette); other cases pass.

- [ ] **Step 3: Update `lib/badge/svg.ts`**

Replace the `PALETTES` and the `nib(...)` helper, and swap the nib call in `renderBadgeSvg` for a rainbow arc. Keep `W`/`H`, the mono `FONT`, the two `<text>` strings, and the trailing accent dot:

```ts
const PALETTES: Record<BadgeTheme, Palette> = {
  light: { bg: "#FAF8F1", border: "#E2DACB", ink: "#16130F", faint: "#4A433B", accent: "#E23B2E" },
  dark:  { bg: "#16130F", border: "#2E2820", ink: "#FAF8F1", faint: "#C8BFB0", accent: "#FF5FA2" },
};

// A tiny hand-drawn marker rainbow — concentric solid-colour arcs. Self-contained:
// solid strokes only (no gradients/url()), so the cross-site SVG stays portable.
function rainbow(x: number, y: number): string {
  const arcs: [string, number][] = [
    ["#7B2FBE", 10], ["#E23B2E", 8.2], ["#FF5FA2", 6.4], ["#1EA83C", 4.6], ["#1C4FD6", 2.8],
  ];
  const paths = arcs
    .map(([c, r]) => `<path d="M${12 - r} 16 A ${r} ${r} 0 0 1 ${12 + r} 16" stroke="${c}"/>`)
    .join("");
  return `<g transform="translate(${x},${y})" fill="none" stroke-width="1.7" stroke-linecap="round">${paths}</g>`;
}
```

In `renderBadgeSvg`, replace `${nib(12, 10, p.accent, p.bg)}` with `${rainbow(10, 8)}` and delete the now-unused `nib` function.

- [ ] **Step 4: Update `components/badge/HumanMadeBadge.tsx`**

Mirror the change: update both `PALETTES` entries to the new tokens (same hex as Step 3) and replace the `<Nib …/>` component with an inline rainbow arc:

```tsx
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
```

Swap `<Nib accent={p.accent} bg={p.bg} />` for `<Rainbow />` and delete the old `Nib` function.

- [ ] **Step 5: Run badge tests to verify they pass (green)**

Run: `npx jest badge -v`
Expected: PASS — colour assertions now match; self-containment (`no url(`, no `@import`, no `xlink:href`), dimensions, and strings still hold.

- [ ] **Step 6: Manual visual check**

Run: `npm run dev`, open the dashboard (`BadgeEmbed`) and `GET /api/badge/<id>` directly. Confirm the badge shows a marker rainbow on bright paper, light + dark themes both read well.

- [ ] **Step 7: Commit**

```bash
git add lib/badge/svg.ts components/badge/HumanMadeBadge.tsx tests/unit/badge.test.ts
git commit -m "feat(design): on-brand rainbow embeddable badge"
```

---

### Task 10: Chrome + login restyle

**Files:**
- Modify: `components/Chrome.tsx`
- Modify: `app/login/page.tsx`

**Interfaces:**
- Consumes: classes from Task 1.

- [ ] **Step 1: Restyle `components/Chrome.tsx` (markup/classNames only)**

Keep the `SiteHeader`/`SiteFooter` exports, the brand text `Human Made`, the `.dot`, and all footer copy + links verbatim (footer text appears in trust messaging). The new CSS from Task 1 already restyles `.site-header`, `.brand`, `.nav`, `.site-footer`. No structural change is required; if desired, add the brand rainbow mark before the wordmark by importing nothing new — leave as-is to avoid risk. (No code change beyond confirming classes; if the file already uses the right classes, this step is a no-op verification.)

- [ ] **Step 2: Restyle `app/login/page.tsx`**

Apply `.kicker` to the eyebrow, `<h1>` for the title (Anton via Task 1), `.lede`/`.muted` for supporting copy, and ensure the form uses `.field`/`label`/`.btn .btn.primary .block`. Preserve every input label and button name verbatim (login/magic-link copy is referenced by E2E helpers — e.g. "Request early access" lives in `SignupForm`, but confirm the login page's own button text is unchanged).

- [ ] **Step 3: E2E + build**

Run: `npm run test:e2e && npm run build`
Expected: 12/12 E2E pass (auth flows depend on these pages); build compiles.

- [ ] **Step 4: Manual visual check**

Run: `npm run dev`, open `/login` and confirm header/footer/login read on-brand and bold.

- [ ] **Step 5: Commit**

```bash
git add components/Chrome.tsx app/login/page.tsx
git commit -m "feat(design): on-brand site chrome + login"
```

---

### Task 11: Authed app restyle (dashboard, community, admin, account)

**Files:**
- Modify: `app/dashboard/page.tsx`
- Modify: `app/community/page.tsx`
- Modify: `app/admin/page.tsx`
- Modify: `app/account/page.tsx`
- Modify (as needed): related components under `components/dashboard/`, `components/community/`, `components/admin/`

**Interfaces:**
- Consumes: classes from Task 1 (`.dash-grid`, `.panel`, `.bignum`, `.progress`, `.badge`, `table.users`, `.btn`, `.field`).

- [ ] **Step 1: Restyle each page's markup/classNames only — preserve all tested strings**

Work one page at a time. Apply the system using existing classes; do not alter logic, props, data, or any accessible name / copy asserted by tests. Specifically preserve verbatim: "Your feedback", "send feedback", "we read every note", upvote button names (`upvote <title>`), "Promote", "Unpromote", "delete my account", "confirm delete", and any release/Loom/admin control labels. The dashboard `bignum`/`progress`/`panel` and the admin `table.users` already pick up the new look from Task 1; the work here is ensuring each page uses those classes and the Anton/`.kicker` headings.

- [ ] **Step 2: Run the FULL regression after each page (catch selector breaks early)**

Run: `npm run test:e2e`
Expected: 12/12 pass. If a test fails because an accessible name changed, restore the original string (do not weaken the test).

- [ ] **Step 3: Build + lint + unit**

Run: `npm run build && npm run lint && npm test`
Expected: all green.

- [ ] **Step 4: Manual visual check**

Run: `npm run dev`. Sign in (admin: `alberto@aqurastudio.com`) and walk dashboard, `/community`, `/admin`, `/account`. Confirm calm-but-on-brand: Anton headings, Courier Prime body, rainbow progress, marker accents, selection + trail working, dense screens still readable.

- [ ] **Step 5: Commit**

```bash
git add app/dashboard/page.tsx app/community/page.tsx app/admin/page.tsx app/account/page.tsx components/
git commit -m "feat(design): on-brand authed app (calm theatrics)"
```

---

### Task 12: Final regression, a11y/perf pass, optional delight

**Files:**
- Optional: `components/Chrome.tsx` (logo draw-in), `app/globals.css` (link underline marks) — only if time allows and tests stay green.

- [ ] **Step 1: Full regression**

Run: `npm run lint && npm test && npm run build && npm run test:e2e`
Expected: lint clean; Jest green (now includes craft-paint, craft-typewriter, SelectionPaint, CursorPaint, Typewriter, updated badge); build compiles; Playwright 12/12.

- [ ] **Step 2: Reduced-motion + performance sanity**

With OS "Reduce motion" ON: reload key pages — confirm no cursor trail, hero shows static "human made", selection stays red, no looping animation. With it OFF: confirm the trail stays smooth (no jank) and pauses when the tab is hidden.

- [ ] **Step 3: Accessibility sanity**

Tab through landing, login, signup, dashboard: visible focus rings; verify-page verdict communicates via icon+label (not colour alone); selection text remains legible (white on a darker marker ink).

- [ ] **Step 4: (Optional) one or two delight touches**

If green and time allows, add at most: a marker-stroke link underline already in Task 1, and/or a logo "draw-in" on first load via SVG `stroke-dashoffset`. Re-run `npm test && npm run build` after any change. Skip if risk to green.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "chore(design): final Living Craft regression + polish"
```

---

## Self-Review

**Spec coverage:**
- Palette + base tokens → Task 1. ✓
- Anton + Courier Prime → Task 1. ✓
- Cursor paint trail (rainbow + media, reduced-motion, fine-pointer, pause) → Task 2 (helpers) + Task 5 (component). ✓
- Text-selection paint (rotation, contrast-safe subset, reduced-motion freeze) → Task 2 (`SELECTION_INKS`) + Task 4. ✓
- Hero typewriter (AI→""→human made, semantic text, reduced-motion) → Task 3 + Task 6 + wired in Task 7. ✓
- Page-by-page (landing theatrics; verify calm + stamp; login; authed calm) → Tasks 7, 8, 10, 11. ✓
- On-brand badge (rainbow arc, new palette, self-contained SVG, test updates) → Task 9. ✓
- Guardrails (reduced-motion, perf, a11y, tests green) → baked into each task + Task 12. ✓
- Delight backlog (optional) → Task 7 (numerals), Task 12 (logo draw-in, underline). ✓

**Placeholder scan:** No "TBD"/"add appropriate styling". Page-restyle tasks name exact classes (defined in Task 1) and preserve exact strings. ✓

**Type consistency:** `nextPaintColor(index, inks?)`, `pickMedium(seed)`, `brushParams(medium)`, `trailEnabled({finePointer,reducedMotion})`, `buildFrames(script)` are used with identical signatures in Tasks 4–6 as defined in Tasks 2–3. Badge keeps `renderBadgeSvg`, `BADGE_WIDTH/HEIGHT`, `HumanMadeBadge`. ✓
