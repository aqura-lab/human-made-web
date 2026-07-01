import { parseSigned, verifySignature, type SignedCertificate } from "@/lib/verify/verify";
import { isValidCertificateId } from "./id";

// Pure gate for publishing: a certificate may be stored only if it parses AND its
// Ed25519 signature verifies. The store is a display cache, never a source of
// trust — this keeps invalid/tampered certificates out of it.

export type PreparedPublish =
  | { ok: true; signed: SignedCertificate; certId: string }
  | { ok: false; error: string };

export function preparePublish(rawJson: string): PreparedPublish {
  let signed: SignedCertificate;
  try {
    signed = parseSigned(rawJson);
  } catch {
    return { ok: false, error: "That doesn't look like a Human Made certificate." };
  }

  const certId = signed?.certificate?.id;
  if (typeof certId !== "string" || !isValidCertificateId(certId)) {
    return { ok: false, error: "The certificate is missing a valid id." };
  }

  if (!verifySignature(signed).ok) {
    return { ok: false, error: "The certificate's signature could not be verified." };
  }

  return { ok: true, signed, certId };
}
