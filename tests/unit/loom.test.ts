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
  it("rejects allowlist-bypass lookalike hosts", () => {
    // Subdomain bypass attempt
    expect(loomEmbedUrl("https://www.loom.com.evil.com/share/abc")).toBeNull();
    // Domain embedded in path
    expect(loomEmbedUrl("https://evil.com/www.loom.com/embed/abc")).toBeNull();
    // @ character bypass
    expect(loomEmbedUrl("https://www.loom.com@evil.com/share/abc")).toBeNull();
    // JavaScript protocol injection
    expect(loomEmbedUrl("javascript:alert(1)")).toBeNull();
    // HTTP instead of HTTPS
    expect(loomEmbedUrl("http://www.loom.com/share/abc")).toBeNull();
  });
  it("normalizes share URLs with query strings to embed URLs", () => {
    expect(loomEmbedUrl("https://www.loom.com/share/abc123?t=10")).toBe("https://www.loom.com/embed/abc123");
  });
  it("exports the canonical setting key", () => {
    expect(LOOM_SETTING_KEY).toBe("loom_dashboard_url");
  });
});
