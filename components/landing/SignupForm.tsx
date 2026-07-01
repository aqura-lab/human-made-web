"use client";

import { useState } from "react";

type Status = "idle" | "submitting" | "done" | "error";

export function SignupForm({ referralCode }: { referralCode?: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [password, setPassword] = useState("");
  const [gdpr, setGdpr] = useState(false);
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const consented = gdpr && terms && privacy;
  const canSubmit = consented && name.trim() !== "" && email.trim() !== "" && status !== "submitting";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setStatus("submitting");
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          reason,
          consentGdpr: gdpr,
          consentTerms: terms,
          consentPrivacy: privacy,
          ref: referralCode,
          ...(password ? { password } : {}),
        }),
      });
      if (!res.ok) throw new Error("failed");
      setStatus("done");
      setMessage("You've got mail! We sent a link to confirm your email.");
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  }

  if (status === "done") {
    return (
      <div className="panel" role="status">
        <p className="confirm-mark">✦</p>
        <p>{message}</p>
        <p className="muted small">The link expires in 15 minutes and can be used once.</p>
      </div>
    );
  }

  return (
    <form className="panel signup" onSubmit={onSubmit} noValidate>
      <div className="field">
        <label htmlFor="name">Name</label>
        <input id="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
      </div>
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
      </div>
      <div className="field">
        <label htmlFor="reason">Tell us why you want early access</label>
        <textarea id="reason" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="password">Set a password (optional)</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          minLength={10}
          placeholder="At least 10 characters — for faster login later"
        />
      </div>

      <fieldset className="consent">
        <label>
          <input type="checkbox" checked={gdpr} onChange={(e) => setGdpr(e.target.checked)} />
          <span>I consent to data processing to manage my early-access request (GDPR).</span>
        </label>
        <label>
          <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} />
          <span>
            I accept the <a href="/terms">Terms &amp; Conditions</a>.
          </span>
        </label>
        <label>
          <input type="checkbox" checked={privacy} onChange={(e) => setPrivacy(e.target.checked)} />
          <span>
            I have read the <a href="/privacy">Privacy Policy</a>.
          </span>
        </label>
      </fieldset>

      <button type="submit" className="btn primary" disabled={!canSubmit}>
        {status === "submitting" ? "Sending…" : "Request early access"}
      </button>
      {status === "error" && (
        <p className="error" role="alert">
          {message}
        </p>
      )}
      <p className="muted small">
        Your draft text never leaves your device. Human Made certifies how your work was written and it
        is not an AI detector.
      </p>
    </form>
  );
}
