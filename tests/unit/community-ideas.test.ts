import { isVotableIdea, isPublishableIdea, toPublicIdea, byVoteCountDesc } from "@/lib/community/ideas";

const base = { id: "f1", publicTitle: "Add dark mode", tag: "UX", public: true, status: "NEW" };

describe("isVotableIdea", () => {
  it("true only when public and not hidden", () => {
    expect(isVotableIdea({ public: true, status: "NEW" })).toBe(true);
    expect(isVotableIdea({ public: true, status: "REVIEWED" })).toBe(true);
    expect(isVotableIdea({ public: false, status: "NEW" })).toBe(false);
    expect(isVotableIdea({ public: true, status: "HIDDEN" })).toBe(false);
  });
});

describe("isPublishableIdea", () => {
  it("requires a clean admin-authored public title, never the raw body", () => {
    // Defense-in-depth for the privacy invariant: an idea is only publishable to
    // the board when it carries a non-empty publicTitle. The raw private body is
    // never a source of the public label, so it can never leak to the board.
    expect(isPublishableIdea(base)).toBe(true);
    expect(isPublishableIdea({ ...base, publicTitle: null })).toBe(false);
    expect(isPublishableIdea({ ...base, publicTitle: "   " })).toBe(false);
    expect(isPublishableIdea({ ...base, status: "HIDDEN" })).toBe(false);
    expect(isPublishableIdea({ ...base, public: false })).toBe(false);
  });
});

describe("toPublicIdea", () => {
  it("uses publicTitle and never leaks author/body identity", () => {
    const idea = toPublicIdea(base, 3, true);
    expect(idea).toEqual({ id: "f1", title: "Add dark mode", tag: "UX", voteCount: 3, votedByMe: true });
    // structural guarantee: no author/body/userId keys
    expect(Object.keys(idea).sort()).toEqual(["id", "tag", "title", "voteCount", "votedByMe"]);
  });

  it("derives the title only from publicTitle (no body input exists)", () => {
    const idea = toPublicIdea({ ...base, publicTitle: "  Trimmed me  " }, 0, false);
    expect(idea.title).toBe("Trimmed me");
  });
});

describe("byVoteCountDesc", () => {
  it("orders higher vote counts first", () => {
    const a = toPublicIdea(base, 1, false);
    const b = toPublicIdea({ ...base, id: "f2" }, 5, false);
    expect([a, b].sort(byVoteCountDesc).map((i) => i.id)).toEqual(["f2", "f1"]);
  });
});
