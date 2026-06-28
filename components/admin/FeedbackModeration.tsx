"use client";

import { useState } from "react";

type Item = {
  id: string;
  body: string;
  tag: string;
  status: string;
  anonymized: boolean;
  createdAt: string;
};

const STATUSES = ["NEW", "REVIEWED", "HIDDEN"] as const;

export function FeedbackModeration({ items }: { items: Item[] }) {
  const [rows, setRows] = useState(items);

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
        </div>
      ))}
    </div>
  );
}
