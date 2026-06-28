import { prisma } from "@/lib/db";
import { decideDownload, type DownloadState } from "@/lib/release/gating";

export async function getCurrentRelease() {
  return prisma.release.findFirst({ where: { isCurrent: true }, orderBy: { createdAt: "desc" } });
}

export async function createRelease(input: {
  version: string; fileName: string; blobUrl: string;
  sizeBytes?: number | null; sha256?: string | null; notes?: string | null;
}) {
  return prisma.$transaction(async (tx) => {
    await tx.release.updateMany({ where: { isCurrent: true }, data: { isCurrent: false } });
    return tx.release.create({ data: { ...input, isCurrent: true } });
  });
}

export async function setUserDownloadReleased(userId: string, released: boolean) {
  await prisma.user.update({
    where: { id: userId },
    data: { downloadReleasedAt: released ? new Date() : null },
  });
}

export async function getDownloadStateForUser(userId: string): Promise<DownloadState> {
  const [user, release] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { downloadReleasedAt: true } }),
    getCurrentRelease(),
  ]);
  return decideDownload({ downloadReleasedAt: user.downloadReleasedAt, release });
}
