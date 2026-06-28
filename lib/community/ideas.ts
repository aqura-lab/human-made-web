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
  body: string;
  publicTitle: string | null;
  tag: string;
  public: boolean;
  status: string;
};

const MAX_FALLBACK_TITLE = 80;

export function isVotableIdea(f: { public: boolean; status: string }): boolean {
  return f.public && f.status !== "HIDDEN";
}

export function toPublicIdea(f: IdeaInput, voteCount: number, votedByMe: boolean): PublicIdea {
  const title =
    f.publicTitle && f.publicTitle.trim().length > 0
      ? f.publicTitle.trim()
      : f.body.trim().slice(0, MAX_FALLBACK_TITLE);
  return { id: f.id, title, tag: f.tag, voteCount, votedByMe };
}

export function byVoteCountDesc(a: PublicIdea, b: PublicIdea): number {
  return b.voteCount - a.voteCount;
}
