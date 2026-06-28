import { readFileSync } from "node:fs";
import { join } from "node:path";
import { verifyCertificate, CertificateFormatError } from "@/lib/verify/service";

const FIX = join(process.cwd(), "tests/fixtures/certificates");
const registered = readFileSync(join(FIX, "sample.registered.json"), "utf8");
// The fixture's final_text_sha256 is the SHA-256 of this exact string.
const MATCHING_TEXT = "hello world";

describe("verifyCertificate", () => {
  it("validates a genuine Rust-signed, registered certificate", () => {
    const r = verifyCertificate(registered);
    expect(r.valid).toBe(true);
    expect(r.registered).toBe(true);
    expect(r.registrationState).toBe("registered");
    expect(r.tier).toEqual({ code: "no-bulk-paste", name: "No-Bulk-Paste" });
    expect(r.verdict.code).toBe("eligible-with-disclosures");
  });

  it("always surfaces a non-detector limitation", () => {
    const r = verifyCertificate(registered);
    expect(r.limitations.join(" ").toLowerCase()).toContain("not");
    expect(r.limitations.some((l) => /ai/i.test(l))).toBe(true);
  });

  it("rejects a certificate whose signature byte was altered", () => {
    const tampered = JSON.parse(registered);
    const sig: string = tampered.signature;
    // flip the first hex digit
    tampered.signature = (sig[0] === "f" ? "e" : "f") + sig.slice(1);
    const r = verifyCertificate(JSON.stringify(tampered));
    expect(r.valid).toBe(false);
    expect(r.reason).toBeTruthy();
  });

  it("confirms a text match when the provided text hashes to the bound hash", () => {
    expect(verifyCertificate(registered, MATCHING_TEXT).textMatch).toBe(true);
  });

  it("reports a text mismatch for the wrong text", () => {
    expect(verifyCertificate(registered, "different text").textMatch).toBe(false);
  });

  it("leaves textMatch null when no text is provided", () => {
    expect(verifyCertificate(registered).textMatch).toBeNull();
  });

  it("throws a format error on non-certificate input", () => {
    expect(() => verifyCertificate("{not a cert}")).toThrow(CertificateFormatError);
    expect(() => verifyCertificate("garbage")).toThrow(CertificateFormatError);
  });

  it("never echoes the pasted text back in its result", () => {
    const r = verifyCertificate(registered, MATCHING_TEXT);
    expect(JSON.stringify(r)).not.toContain(MATCHING_TEXT);
  });
});
