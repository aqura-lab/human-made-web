import {
  TRAIL_INKS, SELECTION_INKS, MEDIA,
  nextPaintColor, pickMedium, brushParams, trailEnabled,
} from "@/lib/craft/paint";

const PAPER = "#FAF8F1"; // the white selection text colour (var(--paper))

function relLuminance(hex: string): number {
  const c = hex.replace("#", "");
  const chan = [0, 2, 4].map((i) => parseInt(c.slice(i, i + 2), 16) / 255);
  const lin = (v: number) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  const [r, g, b] = chan.map(lin);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(a: string, b: string): number {
  const la = relLuminance(a);
  const lb = relLuminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

describe("ink lists", () => {
  it("has 8 trail inks and 5 selection inks that all meet WCAG AA against white text", () => {
    expect(TRAIL_INKS).toHaveLength(8);
    expect(SELECTION_INKS).toHaveLength(5);
    // Selection paints white text, so every selection ink must clear AA (4.5:1).
    for (const ink of SELECTION_INKS) {
      expect(contrastRatio(ink, PAPER)).toBeGreaterThanOrEqual(4.5);
    }
    // The light inks are NEVER used for selection (white text would be illegible).
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
