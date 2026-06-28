import { isVotableIdea, toPublicIdea, byVoteCountDesc } from "@/lib/community/ideas";

const base = { id: "f1", body: "raw private text", publicTitle: "Add dark mode", tag: "UX", public: true, status: "NEW" };

describe("isVotableIdea", () => {
  it("true only when public and not hidden", () => {
    expect(isVotableIdea({ public: true, status: "NEW" })).toBe(true);
    expect(isVotableIdea({ public: true, status: "REVIEWED" })).toBe(true);
    expect(isVotableIdea({ public: false, status: "NEW" })).toBe(false);
    expect(isVotableIdea({ public: true, status: "HIDDEN" })).toBe(false);
  });
});

describe("toPublicIdea", () => {
  it("uses publicTitle and never leaks author/body identity", () => {
    const idea = toPublicIdea(base, 3, true);
    expect(idea).toEqual({ id: "f1", title: "Add dark mode", tag: "UX", voteCount: 3, votedByMe: true });
    // structural guarantee: no author/body/userId keys
    expect(Object.keys(idea).sort()).toEqual(["id", "tag", "title", "voteCount", "votedByMe"]);
  });

  it("falls back to a trimmed body snippet when no publicTitle", () => {
    const longBody = "x".repeat(200);
    const idea = toPublicIdea({ ...base, publicTitle: null, body: longBody }, 0, false);
    expect(idea.title.length).toBeLessThanOrEqual(80);
  });
});

describe("byVoteCountDesc", () => {
  it("orders higher vote counts first", () => {
    const a = toPublicIdea(base, 1, false);
    const b = toPublicIdea({ ...base, id: "f2" }, 5, false);
    expect([a, b].sort(byVoteCountDesc).map((i) => i.id)).toEqual(["f2", "f1"]);
  });
});
