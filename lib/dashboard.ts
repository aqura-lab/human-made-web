import { prisma } from "@/lib/db";
import { queuePosition, type QueueUser } from "@/lib/queue";
import { countConvertedReferrals, referralProgress } from "@/lib/referral/progress";
import { appUrl } from "@/lib/auth/magic";

export function referralGoal(): number {
  return Number(process.env.REFERRAL_GOAL ?? "5");
}

export type DashboardData = {
  name: string;
  verified: boolean;
  position: number | null;
  referralLink: string;
  converted: number;
  goal: number;
  perkUnlocked: boolean;
};

export async function getDashboardData(userId: string): Promise<DashboardData> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  // Queue ranking. Fetch the sort keys of all eligible users (beta scale).
  const eligible = await prisma.user.findMany({
    where: { emailVerified: { not: null }, deletedAt: null },
    select: { id: true, priorityBoost: true, createdAt: true, emailVerified: true, deletedAt: true },
  });
  const me: QueueUser = {
    id: user.id,
    priorityBoost: user.priorityBoost,
    createdAt: user.createdAt,
    emailVerified: user.emailVerified,
    deletedAt: user.deletedAt,
  };
  const position = queuePosition(me, eligible);

  const referrals = await prisma.user.findMany({
    where: { referredById: userId },
    select: { emailVerified: true, deletedAt: true },
  });
  const goal = referralGoal();
  const progress = referralProgress(countConvertedReferrals(referrals), goal);

  return {
    name: user.name,
    verified: user.emailVerified !== null,
    position,
    referralLink: `${appUrl()}/?ref=${user.referralCode}`,
    converted: progress.converted,
    goal,
    perkUnlocked: progress.perkUnlocked,
  };
}
