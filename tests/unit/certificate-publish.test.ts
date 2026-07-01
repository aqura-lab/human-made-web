import { readFileSync } from "node:fs";
import { join } from "node:path";
import { preparePublish } from "@/lib/certificate/publish";

const raw = readFileSync(
  join(process.cwd(), "tests/fixtures/certificates/sample.registered.json"),
  "utf8",
);
const CERT_ID = "11111111-2222-3333-4444-555555555555";

describe("preparePublish", () => {
  it("accepts a valid signed certificate and extracts its id", () => {
    const res = preparePublish(raw);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.certId).toBe(CERT_ID);
      expect(res.signed.certificate.id).toBe(CERT_ID);
    }
  });

  it("rejects a certificate whose signature no longer verifies", () => {
    const obj = JSON.parse(raw) as { signature: string };
    const sig = obj.signature;
    obj.signature = sig.slice(0, -1) + (sig.endsWith("A") ? "B" : "A"); // flip the last char
    expect(preparePublish(JSON.stringify(obj)).ok).toBe(false);
  });

  it("rejects non-JSON and structurally invalid payloads", () => {
    expect(preparePublish("not json at all").ok).toBe(false);
    expect(preparePublish("{}").ok).toBe(false);
    expect(preparePublish(JSON.stringify({ certificate: {} })).ok).toBe(false);
  });
});
