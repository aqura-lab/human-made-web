import { prisma } from "@/lib/db";

// Prisma layer for published certificates. Stores only the already-public signed
// JSON (no raw text); the registry re-parses + re-verifies it on every render.

export type PublishResult = { ok: true } | { ok: false; reason: "owned" };

/** Load a stored certificate row by its public id (or null). */
export async function loadCertificateRow(id: string) {
  return prisma.certificate.findUnique({ where: { id } });
}

/**
 * Upsert a certificate keyed by its own id. If the id is already published by a
 * different (non-null) user, refuse — the first publisher owns it.
 */
export async function publishCertificate(args: {
  userId: string;
  certId: string;
  signedJson: string;
  articleUrl: string | null;
}): Promise<PublishResult> {
  const existing = await prisma.certificate.findUnique({ where: { id: args.certId } });
  if (existing && existing.userId && existing.userId !== args.userId) {
    return { ok: false, reason: "owned" };
  }
  await prisma.certificate.upsert({
    where: { id: args.certId },
    create: {
      id: args.certId,
      signedJson: args.signedJson,
      articleUrl: args.articleUrl,
      userId: args.userId,
    },
    update: {
      signedJson: args.signedJson,
      articleUrl: args.articleUrl,
      userId: args.userId,
    },
  });
  return { ok: true };
}

/** Remove a certificate — only if the caller owns it. Returns whether one was removed. */
export async function unpublishCertificate(userId: string, id: string): Promise<boolean> {
  const { count } = await prisma.certificate.deleteMany({ where: { id, userId } });
  return count > 0;
}

/** The caller's own published certificates, newest first. */
export async function listUserCertificates(userId: string) {
  return prisma.certificate.findMany({
    where: { userId },
    orderBy: { publishedAt: "desc" },
    select: { id: true, articleUrl: true, publishedAt: true },
  });
}
