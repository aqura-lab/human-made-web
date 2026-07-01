"use client";

import { useState } from "react";

type Mode = "password" | "magic";

export function LoginForm() {
  const [mode, setMode] = useState<Mode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function onPassword(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        window.location.href = "/dashboard";
        return;
      }
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? "Invalid email or password.");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function onMagic(e: React.FormEvent) {
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

  const disabled = busy || email.trim() === "" || (mode === "password" && password === "");

  return (
    <form className="panel" onSubmit={mode === "password" ? onPassword : onMagic}>
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

      {mode === "password" && (
        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>
      )}

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <button className="btn primary block" type="submit" disabled={disabled}>
        {busy
          ? mode === "password"
            ? "Signing in…"
            : "Sending…"
          : mode === "password"
            ? "Log in"
            : "Email me a sign-in link"}
      </button>

      <button
        type="button"
        className="btn block"
        style={{ marginTop: 8 }}
        onClick={() => {
          setMode(mode === "password" ? "magic" : "password");
          setError("");
        }}
      >
        {mode === "password" ? "Email me a link instead" : "Use a password instead"}
      </button>

      <p className="muted small" style={{ marginTop: 10 }}>
        {mode === "password"
          ? "Log in with your password, or switch to a one-time email link."
          : "Passwordless — we email you a one-time link. No password needed."}
      </p>
    </form>
  );
}
