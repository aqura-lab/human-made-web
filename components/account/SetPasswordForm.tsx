"use client";

import { useState } from "react";

export function SetPasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...(hasPassword ? { currentPassword: current } : {}),
          newPassword: next,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (res.ok) {
        setMsg({ ok: true, text: "Password updated." });
        setCurrent("");
        setNext("");
      } else {
        setMsg({ ok: false, text: data.error ?? "Could not update password." });
      }
    } catch {
      setMsg({ ok: false, text: "Something went wrong. Please try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      {hasPassword && (
        <div className="field">
          <label htmlFor="current-password">Current password</label>
          <input
            id="current-password"
            type="password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>
      )}
      <div className="field">
        <label htmlFor="new-password">{hasPassword ? "New password" : "Password"}</label>
        <input
          id="new-password"
          type="password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          autoComplete="new-password"
          minLength={10}
          placeholder="At least 10 characters"
          required
        />
      </div>
      <button
        className="btn primary"
        type="submit"
        disabled={busy || next.length < 10 || (hasPassword && current === "")}
      >
        {busy ? "Saving…" : hasPassword ? "Change password" : "Set password"}
      </button>
      {msg && (
        <p className={msg.ok ? "muted small" : "error"} role="status" style={{ marginTop: 8 }}>
          {msg.text}
        </p>
      )}
    </form>
  );
}
