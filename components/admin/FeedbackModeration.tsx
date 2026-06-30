"use client";

import { useState } from "react";

type Item = {
  id: string;
  body: string;
  tag: string;
  status: string;
  anonymized: boolean;
  createdAt: string;
  public: boolean;
  publicTitle: string | null;
};

const STATUSES = ["NEW", "REVIEWED", "HIDDEN"] as const;

export function FeedbackModeration({ items }: { items: Item[] }) {
  const [rows, setRows] = useState(items);

  async function promote(id: string, isPublic: boolean, publicTitle: string) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, public: isPublic, publicTitle } : r)));
    await fetch("/api/admin/feedback/promote", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, public: isPublic, publicTitle }),
    });
  }

  async function setStatus(id: string, status: string) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
    await fetch("/api/admin/feedback", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
  }

  if (rows.length === 0) return <p className="muted small">No feedback yet.</p>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {rows.map((r) => (
        <div key={r.id} className="panel" style={{ padding: 14 }}>
          <p style={{ margin: "0 0 6px" }}>{r.body}</p>
          <p className="muted small" style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span className="badge">{r.tag}</span>
            {r.anonymized && <span className="badge warn">anonymised</span>}
            <select
              value={r.status}
              onChange={(e) => setStatus(r.id, e.target.value)}
              aria-label={`status for ${r.id}`}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </p>
          <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}>
            <input
              aria-label={`public title for ${r.id}`}
              placeholder="Public idea title"
              value={r.publicTitle ?? ""}
              onChange={(e) => {
                const val = e.target.value;
                setRows((rs) =>
                  rs.map((row) => (row.id === r.id ? { ...row, publicTitle: val } : row)),
                );
              }}
              style={{ flex: 1, padding: "6px 8px", border: "1px solid var(--rule)", borderRadius: 3 }}
            />
            <button
              className="btn"
              type="button"
              disabled={!r.public && !r.publicTitle?.trim()}
              onClick={() => promote(r.id, !r.public, r.publicTitle ?? "")}
            >
              {r.public ? "Unpromote" : "Promote"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
