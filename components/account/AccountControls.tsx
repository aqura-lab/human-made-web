"use client";

import { useState } from "react";

export function EditProfile({ name, reason }: { name: string; reason: string }) {
  const [n, setN] = useState(name);
  const [r, setR] = useState(reason);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setSaved(false);
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: n, reason: r }),
      });
      if (res.ok) setSaved(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save}>
      <div className="field">
        <label htmlFor="acc-name">Name</label>
        <input id="acc-name" value={n} onChange={(e) => setN(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="acc-reason">Why you want early access</label>
        <textarea id="acc-reason" rows={3} value={r} onChange={(e) => setR(e.target.value)} />
      </div>
      <button className="btn" type="submit" disabled={busy}>
        {busy ? "Saving…" : "Save changes"}
      </button>
      {saved && (
        <span className="muted small" style={{ marginLeft: 10 }}>
          Saved.
        </span>
      )}
    </form>
  );
}

export function DeleteAccount() {
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  async function remove() {
    setBusy(true);
    try {
      const res = await fetch("/api/account/delete", { method: "POST" });
      if (res.ok) window.location.href = "/";
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <p className="muted small">
        This removes your personal data. Feedback you left is kept but anonymised. Type{" "}
        <strong>DELETE</strong> to confirm.
      </p>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          aria-label="confirm delete"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="DELETE"
          style={{ maxWidth: 160 }}
        />
        <button
          className="btn"
          style={{ borderColor: "var(--bad)", color: "var(--bad)" }}
          disabled={confirm !== "DELETE" || busy}
          onClick={remove}
          type="button"
        >
          {busy ? "Deleting…" : "Delete my account"}
        </button>
      </div>
    </div>
  );
}
