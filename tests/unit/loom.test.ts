import { loomEmbedUrl, LOOM_SETTING_KEY } from "@/lib/settings/loom";

describe("loomEmbedUrl", () => {
  it("converts a share URL to an embed URL", () => {
    expect(loomEmbedUrl("https://www.loom.com/share/abc123")).toBe("https://www.loom.com/embed/abc123");
  });
  it("passes through an already-embed URL", () => {
    expect(loomEmbedUrl("https://www.loom.com/embed/abc123")).toBe("https://www.loom.com/embed/abc123");
  });
  it("returns null for empty or non-loom input", () => {
    expect(loomEmbedUrl("")).toBeNull();
    expect(loomEmbedUrl(null)).toBeNull();
    expect(loomEmbedUrl("https://evil.test/share/x")).toBeNull();
  });
  it("exports the canonical setting key", () => {
    expect(LOOM_SETTING_KEY).toBe("loom_dashboard_url");
  });
});
