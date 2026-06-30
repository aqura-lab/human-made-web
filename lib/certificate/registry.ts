// Public-certificate lookup seam for the `/c/[id]` landing page and badge.
//
// IMPORTANT — data-model assumption:
// This codebase does NOT yet persist certificates server-side. Verification is
// stateless (paste-and-verify against the Ed25519 signature; see
// `lib/verify/*`), and the privacy invariant means raw drafts/keystrokes never
// leave the device. There is therefore no table mapping a public id to a
// certificate today.
//
// The public landing page keys on the certificate's own `id` field — the UUID
// the desktop app mints and signs into every certificate (e.g. it appears as
// `certificate.id` in the signed JSON). That id is already part of the signed,
// non-secret payload, so it is the natural stable public handle.
//
// `getPublishedCertificate` is the single seam where a future persistence layer
// plugs in (a `Certificate`/`PublishedCertificate` Prisma model, or a Vercel
// Blob keyed by id, storing ONLY the already-public signed certificate JSON the
// writer chose to publish — never raw text). Until that exists it returns
// `null`, and the landing page renders its honest "not located" state with a
// manual verify fallback. Nothing here fabricates a valid-looking certificate.

import type { SignedCertificate } from "@/lib/verify/verify";

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

// Accept the desktop app's UUID ids, plus a conservative slug shape, so we can
// reject obvious garbage early without coupling to one exact id format.
const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;

/** Cheap structural validation of a public certificate id from the URL. */
export function isValidCertificateId(id: string): boolean {
  return ID_PATTERN.test(id);
}

/**
 * Resolve a published certificate by its public id.
 *
 * Returns `null` until a persistence layer is wired (see module note). Async by
 * design so a DB/blob lookup can drop in without changing call sites.
 */
export async function getPublishedCertificate(
  id: string,
): Promise<PublishedCertificate | null> {
  if (!isValidCertificateId(id)) return null;
  // No persistence layer yet — certificates are not stored server-side.
  return null;
}
