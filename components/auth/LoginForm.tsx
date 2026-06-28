"use client";

import { useState } from "react";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await fetch("/api/auth/request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="panel" role="status">
        <p className="confirm-mark">✦</p>
        <p>If that email is registered, a sign-in link is on its way.</p>
        <p className="muted small">The link expires in 15 minutes and can be used once.</p>
      </div>
    );
  }

  return (
    <form className="panel" onSubmit={onSubmit}>
      <div className="field">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
      </div>
      <button className="btn primary block" type="submit" disabled={busy || email.trim() === ""}>
        {busy ? "Sending…" : "Email me a sign-in link"}
      </button>
      <p className="muted small">Passwordless — we email you a one-time link. No passwords to manage.</p>
    </form>
  );
}
