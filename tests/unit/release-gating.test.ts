import { decideDownload } from "@/lib/release/gating";

const rel = { version: "0.1.0", notes: "first build", sha256: "abc", blobUrl: "https://blob/x.dmg" };

describe("decideDownload", () => {
  it("locked when the user is not released", () => {
    expect(decideDownload({ downloadReleasedAt: null, release: rel }).available).toBe(false);
  });
  it("locked when there is no current release", () => {
    expect(decideDownload({ downloadReleasedAt: new Date(), release: null }).available).toBe(false);
  });
  it("available with metadata when released and a release exists", () => {
    const s = decideDownload({ downloadReleasedAt: new Date(), release: rel });
    expect(s).toEqual({ available: true, version: "0.1.0", notes: "first build", sha256: "abc", url: "https://blob/x.dmg" });
  });
  it("never exposes a url when locked", () => {
    expect(decideDownload({ downloadReleasedAt: null, release: rel }).url).toBeNull();
  });
});
