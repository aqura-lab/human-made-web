import { prisma } from "@/lib/db";
import { toPublicIdea, byVoteCountDesc, type PublicIdea } from "@/lib/community/ideas";

export async function getPublicIdeas(userId: string): Promise<PublicIdea[]> {
  const rows = await prisma.feedback.findMany({
    where: { public: true, status: { not: "HIDDEN" } },
    select: {
      id: true, body: true, publicTitle: true, tag: true, public: true, status: true,
      _count: { select: { votes: true } },
      votes: { where: { userId }, select: { id: true } },
    },
  });
  return rows
    .map((r) => toPublicIdea(r, r._count.votes, r.votes.length > 0))
    .sort(byVoteCountDesc);
}
