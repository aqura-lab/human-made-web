import { readFileSync } from "node:fs";
import { join } from "node:path";
import { POST } from "@/app/api/certificate/verify/route";

const registered = readFileSync(
  join(process.cwd(), "tests/fixtures/certificates/sample.registered.json"),
  "utf8",
);

function post(body: unknown): Request {
  return new Request("http://localhost/api/certificate/verify", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/certificate/verify", () => {
  it("returns 200 and a valid result for a genuine certificate", async () => {
    const res = await POST(post({ raw: registered }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.valid).toBe(true);
    expect(json.registered).toBe(true);
    expect(json.tier.name).toBe("No-Bulk-Paste");
    expect(Array.isArray(json.limitations)).toBe(true);
  });

  it("checks provided text against the bound hash", async () => {
    const res = await POST(post({ raw: registered, expectedText: "hello world" }));
    const json = await res.json();
    expect(json.textMatch).toBe(true);
  });

  it("returns 400 for input that is not a certificate", async () => {
    const res = await POST(post({ raw: "garbage" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBeTruthy();
  });

  it("returns 400 when raw is missing", async () => {
    const res = await POST(post({}));
    expect(res.status).toBe(400);
  });
});
