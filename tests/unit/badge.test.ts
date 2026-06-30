import { renderBadgeSvg, BADGE_WIDTH, BADGE_HEIGHT } from "@/lib/badge/svg";
import { isValidCertificateId, getPublishedCertificate } from "@/lib/certificate/registry";
import { GET } from "@/app/api/badge/[id]/route";

const VALID_ID = "11111111-2222-3333-4444-555555555555";

describe("isValidCertificateId", () => {
  it("accepts UUID-style and slug ids", () => {
    expect(isValidCertificateId(VALID_ID)).toBe(true);
    expect(isValidCertificateId("abc123")).toBe(true);
  });

  it("rejects empty, oversized, or unsafe ids", () => {
    expect(isValidCertificateId("")).toBe(false);
    expect(isValidCertificateId("../etc/passwd")).toBe(false);
    expect(isValidCertificateId("has space")).toBe(false);
    expect(isValidCertificateId("a".repeat(200))).toBe(false);
  });
});

describe("renderBadgeSvg", () => {
  it("renders a self-contained SVG with the brand label and no external font", () => {
    const svg = renderBadgeSvg("light");
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).toContain(`width="${BADGE_WIDTH}"`);
    expect(svg).toContain(`height="${BADGE_HEIGHT}"`);
    expect(svg).toContain("Human Made");
    expect(svg).toContain("Download certificate");
    // No external resource fetches (fonts/images/styles) — fully self-contained.
    expect(svg).not.toContain("@import");
    expect(svg).not.toContain("url(");
    expect(svg).not.toContain("xlink:href");
  });

  it("uses a darker background for the dark theme", () => {
    expect(renderBadgeSvg("dark")).toContain("#16130F");
    expect(renderBadgeSvg("light")).toContain("#FAF8F1");
  });
});

describe("getPublishedCertificate", () => {
  it("returns null (no persistence layer yet) and never fabricates a cert", async () => {
    expect(await getPublishedCertificate(VALID_ID)).toBeNull();
    expect(await getPublishedCertificate("anything")).toBeNull();
  });
});

describe("GET /api/badge/[id]", () => {
  it("returns an SVG image for a valid id", async () => {
    const res = await GET(new Request("https://x/api/badge/" + VALID_ID), {
      params: Promise.resolve({ id: VALID_ID }),
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("image/svg+xml");
    expect(res.headers.get("cache-control")).toContain("public");
    expect(await res.text()).toContain("Human Made");
  });

  it("honors the dark theme query param", async () => {
    const res = await GET(new Request("https://x/api/badge/" + VALID_ID + "?theme=dark"), {
      params: Promise.resolve({ id: VALID_ID }),
    });
    expect(await res.text()).toContain("#16130F");
  });

  it("rejects a malformed id with 400 (no broken image, no injection)", async () => {
    const res = await GET(new Request("https://x/api/badge/bad%20id"), {
      params: Promise.resolve({ id: "bad id" }),
    });
    expect(res.status).toBe(400);
  });
});
