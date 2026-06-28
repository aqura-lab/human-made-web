"use client";

import { useState } from "react";

type Result = {
  valid: boolean;
  registered: boolean;
  registrationState: "none" | "registered" | "mismatch";
  textMatch: boolean | null;
  tier: { code: string; name: string };
  verdict: { code: string; name: string };
  limitations: string[];
  reason?: string;
};

export function CertificateVerifier() {
  const [raw, setRaw] = useState("");
  const [expectedText, setExpectedText] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/certificate/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ raw, expectedText: expectedText || undefined }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Could not verify this certificate.");
        return;
      }
      setResult(json as Result);
    } catch {
      setError("Could not verify this certificate.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <form onSubmit={verify}>
        <div className="field">
          <label htmlFor="cert">Certificate</label>
          <textarea
            id="cert"
            rows={5}
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder="Paste a Human Made certificate (JSON) from an article…"
          />
        </div>
        <div className="field">
          <label htmlFor="text">Published text to match (optional)</label>
          <textarea
            id="text"
            rows={2}
            value={expectedText}
            onChange={(e) => setExpectedText(e.target.value)}
            placeholder="Paste the published text to confirm it matches the certified text."
          />
        </div>
        <button className="btn primary" type="submit" disabled={busy || raw.trim() === ""}>
          {busy ? "Verifying…" : "Verify certificate"}
        </button>
      </form>

      {error && (
        <p className="error" role="alert" style={{ marginTop: 12 }}>
          {error}
        </p>
      )}

      {result && (
        <div className="panel" style={{ marginTop: 14 }} role="status">
          <p>
            <span className={`badge ${result.valid ? "ok" : "bad"}`}>
              {result.valid ? "Signature valid" : "Not valid"}
            </span>{" "}
            <span className={`badge ${result.registered ? "ok" : "warn"}`}>
              {result.registrationState === "registered"
                ? "Registered"
                : result.registrationState === "mismatch"
                  ? "Registration mismatch"
                  : "Not registered"}
            </span>{" "}
            {result.textMatch !== null && (
              <span className={`badge ${result.textMatch ? "ok" : "bad"}`}>
                {result.textMatch ? "Text matches" : "Text does not match"}
              </span>
            )}
          </p>
          <p className="tier">
            Tier: <strong>{result.tier.name}</strong> · {result.verdict.name}
          </p>
          {result.reason && <p className="muted small">{result.reason}</p>}
          <p className="muted small" style={{ marginTop: 8 }}>
            What this does <em>not</em> prove:
          </p>
          <ul>
            {result.limitations.map((l, i) => (
              <li key={i} className="lim">
                {l}
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="muted small" style={{ marginTop: 10 }}>
        Verification runs offline against the certificate&apos;s signature — Human Made is not an AI
        detector.
      </p>
    </div>
  );
}
