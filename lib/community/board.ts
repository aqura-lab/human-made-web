import { prisma } from "@/lib/db";
import { toPublicIdea, isPublishableIdea, byVoteCountDesc, type PublicIdea } from "@/lib/community/ideas";

export async function getPublicIdeas(userId: string): Promise<PublicIdea[]> {
  // The raw `body` is deliberately NOT selected — private feedback text never
  // leaves the DB for the public board. A clean publicTitle is required.
  const rows = await prisma.feedback.findMany({
    where: { public: true, status: { not: "HIDDEN" }, publicTitle: { not: null } },
    select: {
      id: true, publicTitle: true, tag: true, public: true, status: true,
      _count: { select: { votes: true } },
      votes: { where: { userId }, select: { id: true } },
    },
  });
  return rows
    .filter(isPublishableIdea) // drops whitespace-only titles the SQL not-null can't catch
    .map((r) => toPublicIdea(r, r._count.votes, r.votes.length > 0))
    .sort(byVoteCountDesc);
}
