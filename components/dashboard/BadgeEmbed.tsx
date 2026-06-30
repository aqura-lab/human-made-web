"use client";

import { useMemo, useState } from "react";
import { HumanMadeBadge } from "@/components/badge/HumanMadeBadge";
import { isValidCertificateId } from "@/lib/certificate/registry";

// "Get your badge" UI. The owner pastes their certificate (or just its id) —
// parsing happens entirely in the browser, so no certificate data is sent to
// our servers (privacy invariant). We extract the public `certificate.id` and
// generate copy-paste embed snippets pointing at /c/[id] and /api/badge/[id].

const PLACEHOLDER_ID = "your-certificate-id";

/** Pull the public certificate id from pasted JSON, or accept a bare id. */
function extractId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  try {
    const obj = JSON.parse(trimmed);
    const id = obj?.certificate?.id ?? obj?.id;
    if (typeof id === "string" && isValidCertificateId(id)) return id;
    return null;
  } catch {
    // Not JSON — treat the input itself as a candidate id.
    return isValidCertificateId(trimmed) ? trimmed : null;
  }
}

function CopyBlock({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <label>{label}</label>
        <button type="button" className="btn" onClick={copy} style={{ padding: "4px 10px", fontSize: 12 }}>
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="code-pill" style={{ whiteSpace: "pre-wrap", margin: "6px 0 0" }}>
        {value}
      </pre>
    </div>
  );
}

export function BadgeEmbed({ baseUrl }: { baseUrl: string }) {
  const [input, setInput] = useState("");
  const id = useMemo(() => extractId(input), [input]);
  const touched = input.trim().length > 0;

  const previewId = id ?? PLACEHOLDER_ID;
  const base = baseUrl.replace(/\/+$/, "");
  const certUrl = `${base}/c/${previewId}`;
  const badgeUrl = `${base}/api/badge/${previewId}`;

  const html = `<a href="${certUrl}" target="_blank" rel="noopener">\n  <img src="${badgeUrl}" alt="Human Made — verified writing process" width="280" height="44" />\n</a>`;
  const markdown = `[![Human Made — verified writing process](${badgeUrl})](${certUrl})`;

  return (
    <div className="panel span-2">
      <p className="kicker">Share your proof</p>
      <h3>Get your &ldquo;Human Made&rdquo; badge</h3>
      <p className="muted small" style={{ marginBottom: 12 }}>
        Embed a small badge on your article (Substack, a newsletter, your own site). Readers click it
        and land on a public page that lets them verify your certificate. Paste your certificate —
        or just its id — below; it&apos;s read in your browser and never sent to us.
      </p>

      <div className="field">
        <label htmlFor="badge-cert">Your certificate (or its id)</label>
        <textarea
          id="badge-cert"
          rows={3}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste your Human Made certificate JSON, or just the certificate id…"
        />
      </div>

      {touched && !id && (
        <p className="error" role="alert">
          Couldn&apos;t read a certificate id from that. Paste the certificate JSON or a valid id.
        </p>
      )}

      <div style={{ marginTop: 8 }}>
        <label>Preview</label>
        <div style={{ marginTop: 8, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <HumanMadeBadge id={previewId} theme="light" />
          <HumanMadeBadge id={previewId} theme="dark" />
        </div>
        {!id && (
          <p className="muted small" style={{ marginTop: 8 }}>
            Showing a placeholder id. Paste your certificate above to wire the badge to your
            certificate&apos;s public page.
          </p>
        )}
      </div>

      <CopyBlock label="HTML embed (websites, Substack)" value={html} />
      <CopyBlock label="Markdown embed (newsletters, READMEs)" value={markdown} />

      <p className="muted small" style={{ marginTop: 12 }}>
        The badge image is served from <span className="mono">/api/badge/&lt;id&gt;</span> (add{" "}
        <span className="mono">?theme=dark</span> for the dark variant) and links to your public
        certificate page at <span className="mono">/c/&lt;id&gt;</span>.
      </p>
    </div>
  );
}
