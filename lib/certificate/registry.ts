// Public-certificate lookup seam for the `/c/[id]` landing page and badge.
//
// Certificates a writer publishes are stored (see store.ts) as the already-public
// signed JSON only — never raw drafts/keystrokes. This module re-parses and (via
// the page) re-verifies that JSON on every render, so the store is a display
// cache, never a source of trust: a tampered row fails signature verification.

import { parseSigned, type SignedCertificate } from "@/lib/verify/verify";
import { isValidCertificateId } from "./id";
import { loadCertificateRow } from "./store";

export { isValidCertificateId };

/** A certificate a writer has chosen to publish behind a public badge link. */
export type PublishedCertificate = {
  /** The certificate's own `id` (UUID minted + signed by the desktop app). */
  id: string;
  /** The already-public signed certificate JSON (never contains raw text). */
  signed: SignedCertificate;
  /** Optional URL of the article the badge was embedded on. */
  articleUrl?: string;
  /** When the writer published this certificate to the registry. */
  publishedAt?: string;
};

/**
 * Resolve a published certificate by its public id, or `null` if it isn't
 * published or the stored payload no longer parses. Call sites are unchanged
 * from the stateless era — only the body now reads from the store.
 */
export async function getPublishedCertificate(
  id: string,
): Promise<PublishedCertificate | null> {
  if (!isValidCertificateId(id)) return null;

  const row = await loadCertificateRow(id);
  if (!row) return null;

  let signed: SignedCertificate;
  try {
    signed = parseSigned(row.signedJson);
  } catch {
    return null;
  }

  return {
    id: row.id,
    signed,
    articleUrl: row.articleUrl ?? undefined,
    publishedAt: row.publishedAt.toISOString(),
  };
}
