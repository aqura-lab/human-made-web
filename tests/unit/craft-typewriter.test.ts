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
