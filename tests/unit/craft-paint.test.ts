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
