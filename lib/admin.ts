import { prisma } from "@/lib/db";
import { queuePosition, type QueueUser } from "@/lib/queue";

export type AdminUserRow = {
  id: string;
  email: string;
  name: string;
  joinedAt: Date;
  verified: boolean;
  referralCount: number;
  position: number | null;
  downloadReleased: boolean;
};

export async function getAdminUsers(): Promise<AdminUserRow[]> {
  const users = await prisma.user.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { referrals: true } } },
  });

  const eligible: QueueUser[] = users.map((u) => ({
    id: u.id,
    priorityBoost: u.priorityBoost,
    createdAt: u.createdAt,
    emailVerified: u.emailVerified,
    deletedAt: u.deletedAt,
  }));

  return users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    joinedAt: u.createdAt,
    verified: u.emailVerified !== null,
    referralCount: u._count.referrals,
    downloadReleased: u.downloadReleasedAt !== null,
    position: queuePosition(
      {
        id: u.id,
        priorityBoost: u.priorityBoost,
        createdAt: u.createdAt,
        emailVerified: u.emailVerified,
        deletedAt: u.deletedAt,
      },
      eligible,
    ),
  }));
}

export async function getAdminFeedback() {
  return prisma.feedback.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true, body: true, tag: true, status: true, anonymized: true, createdAt: true,
      public: true, publicTitle: true,
    },
  });
}
