// Stateless certificate verification. Wraps the vendored offline verifier
// (Ed25519 signature + registration hash-chain + text-hash binding) into the
// response contract the API route and dashboard use. Persists nothing and must
// never log the pasted certificate or text (privacy invariant).

import {
  parseSigned,
  verifySignature,
  verifyRegistration,
  sha256Hex,
  TIER_NAME,
  VERDICT_NAME,
  type PolicyTier,
  type PolicyVerdict,
  type SignedCertificate,
} from "./verify";

export class CertificateFormatError extends Error {
  constructor(message = "Not a valid Human Made certificate") {
    super(message);
    this.name = "CertificateFormatError";
  }
}

const NON_DETECTOR_LIMITATION =
  "This certifies the observed writing process — it does not prove the absence of AI assistance.";

export type RegistrationState = "none" | "registered" | "mismatch";

export type VerifyResult = {
  valid: boolean;
  registered: boolean;
  registrationState: RegistrationState;
  textMatch: boolean | null;
  tier: { code: PolicyTier; name: string };
  verdict: { code: PolicyVerdict; name: string };
  limitations: string[];
  reason?: string;
};

export function verifyCertificate(raw: string, expectedText?: string): VerifyResult {
  let signed: SignedCertificate;
  try {
    signed = parseSigned(raw);
  } catch {
    throw new CertificateFormatError();
  }

  const cert = signed.certificate;
  const sig = verifySignature(signed);
  const reg = verifyRegistration(signed);

  let textMatch: boolean | null = null;
  if (expectedText !== undefined && expectedText !== "") {
    textMatch = sha256Hex(expectedText) === cert.final_text_sha256;
  }

  const limitations = [...(cert.limitations ?? [])];
  if (!limitations.includes(NON_DETECTOR_LIMITATION)) {
    limitations.push(NON_DETECTOR_LIMITATION);
  }

  return {
    valid: sig.ok,
    registered: reg.state === "registered",
    registrationState: reg.state,
    textMatch,
    tier: { code: cert.granted_tier, name: TIER_NAME[cert.granted_tier] },
    verdict: { code: cert.verdict, name: VERDICT_NAME[cert.verdict] },
    limitations,
    reason: sig.ok ? undefined : sig.reason,
  };
}
