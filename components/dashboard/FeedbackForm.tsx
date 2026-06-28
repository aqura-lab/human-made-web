"use client";

import { useState } from "react";

const TAGS = [
  { value: "UX", label: "UX" },
  { value: "ETHICS", label: "Ethics" },
  { value: "BUGS", label: "Bugs" },
] as const;

export function FeedbackForm() {
  const [body, setBody] = useState("");
  const [tag, setTag] = useState<(typeof TAGS)[number]["value"]>("UX");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body, tag }),
      });
      if (res.ok) {
        setDone(true);
        setBody("");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <div className="field">
        <label htmlFor="fb-tag">Topic</label>
        <select
          id="fb-tag"
          value={tag}
          onChange={(e) => setTag(e.target.value as typeof tag)}
          style={{ padding: "8px 10px", border: "1px solid var(--rule)", borderRadius: 3 }}
        >
          {TAGS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="fb-body">Your feedback</label>
        <textarea id="fb-body" rows={3} value={body} onChange={(e) => setBody(e.target.value)} />
      </div>
      <button className="btn" type="submit" disabled={busy || body.trim() === ""}>
        {busy ? "Sending…" : "Send feedback"}
      </button>
      {done && (
        <p className="muted small" role="status" style={{ marginTop: 8 }}>
          Thanks — we read every note.
        </p>
      )}
    </form>
  );
}
