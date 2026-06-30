// lib/community/ideas.ts
export type PublicIdea = {
  id: string;
  title: string;
  tag: string;
  voteCount: number;
  votedByMe: boolean;
};

export type IdeaInput = {
  id: string;
  publicTitle: string | null;
  tag: string;
  public: boolean;
  status: string;
};

export function isVotableIdea(f: { public: boolean; status: string }): boolean {
  return f.public && f.status !== "HIDDEN";
}

// Defense-in-depth for the "private feedback stays private" invariant: an item
// only reaches the public board when an admin has set a clean publicTitle. The
// raw private body is never fetched for the board and never used as a title, so
// private phrasing/PII cannot leak even if a row were marked public without one.
export function isPublishableIdea(f: {
  public: boolean;
  status: string;
  publicTitle: string | null;
}): boolean {
  return isVotableIdea(f) && !!f.publicTitle && f.publicTitle.trim().length > 0;
}

export function toPublicIdea(f: IdeaInput, voteCount: number, votedByMe: boolean): PublicIdea {
  // Title comes only from the admin-set publicTitle; callers must gate on
  // isPublishableIdea so this is always non-empty.
  const title = (f.publicTitle ?? "").trim();
  return { id: f.id, title, tag: f.tag, voteCount, votedByMe };
}

export function byVoteCountDesc(a: PublicIdea, b: PublicIdea): number {
  return b.voteCount - a.voteCount;
}
