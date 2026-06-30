"use client";

import { useState } from "react";
import type { PublicIdea } from "@/lib/community/ideas";

export function IdeaBoard({ initial }: { initial: PublicIdea[] }) {
  const [ideas, setIdeas] = useState(initial);

  async function toggle(idea: PublicIdea) {
    const next = !idea.votedByMe;
    const previous = ideas;
    setIdeas((xs) =>
      xs.map((i) =>
        i.id === idea.id ? { ...i, votedByMe: next, voteCount: i.voteCount + (next ? 1 : -1) } : i,
      ),
    );
    try {
      const res = await fetch(`/api/community/ideas/${idea.id}/vote`, { method: next ? "POST" : "DELETE" });
      if (!res.ok) setIdeas(previous);
    } catch {
      setIdeas(previous);
    }
  }

  if (ideas.length === 0) return <p className="muted small">No community ideas yet — check back soon.</p>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {ideas.map((i) => (
        <div key={i.id} className="panel" style={{ display: "flex", gap: 14, alignItems: "center", padding: 14 }}>
          <button
            type="button"
            className="btn"
            aria-pressed={i.votedByMe}
            aria-label={`upvote ${i.title}`}
            onClick={() => toggle(i)}
          >
            ▲ {i.voteCount}
          </button>
          <div>
            <p style={{ margin: 0 }}>{i.title}</p>
            <span className="badge">{i.tag}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
