// Pure queue-ranking logic. Queue position is derived, never stored: a user's
// position is 1 + the number of queue-eligible users ranked ahead of them.
// Ordering key = (priorityBoost DESC, createdAt ASC). Keeping this pure means
// referral boosts reorder the queue with zero extra writes, and it is fully
// unit-testable without a database.

export type QueueUser = {
  id: string;
  priorityBoost: number;
  createdAt: Date;
  emailVerified: Date | null;
  deletedAt: Date | null;
};

/** Only verified, non-deleted users occupy a slot in the queue. */
export function isQueueEligible(u: QueueUser): boolean {
  return u.emailVerified !== null && u.deletedAt === null;
}

/** True if `other` ranks ahead of `me` (and is a different user). */
export function isAhead(other: QueueUser, me: QueueUser): boolean {
  if (other.id === me.id) return false;
  if (other.priorityBoost !== me.priorityBoost) {
    return other.priorityBoost > me.priorityBoost;
  }
  return other.createdAt.getTime() < me.createdAt.getTime();
}

/**
 * The 1-based position of `me` within `all`. Returns null when `me` is not
 * queue-eligible (e.g. email not yet verified).
 */
export function queuePosition(me: QueueUser, all: QueueUser[]): number | null {
  if (!isQueueEligible(me)) return null;
  const ahead = all.filter((u) => isQueueEligible(u) && isAhead(u, me)).length;
  return ahead + 1;
}
