"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Published = { id: string; articleUrl: string | null };

function badgeSnippet(baseUrl: string, id: string): string {
  return (
    `<a href="${baseUrl}/c/${id}" target="_blank" rel="noopener">\n` +
    `  <img src="${baseUrl}/api/badge/${id}" alt="Human Made — verified writing process" width="280" height="44" />\n` +
    `</a>`
  );
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="btn"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          setCopied(false);
        }
      }}
    >
      {copied ? "Copied!" : label}
    </button>
  );
}

export function CertificatePublisher({
  baseUrl,
  certificates,
}: {
  baseUrl: string;
  certificates: Published[];
}) {
  const router = useRouter();
  const [json, setJson] = useState("");
  const [articleUrl, setArticleUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [publishedId, setPublishedId] = useState<string | null>(null);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) file.text().then(setJson);
  }

  async function onPublish(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setPublishedId(null);
    try {
      const res = await fetch("/api/certificate/publish", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          json,
          ...(articleUrl.trim() ? { articleUrl: articleUrl.trim() } : {}),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { id?: string; error?: string };
      if (res.ok && data.id) {
        setPublishedId(data.id);
        setJson("");
        setArticleUrl("");
        router.refresh();
      } else {
        setError(data.error ?? "Could not publish that certificate.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function onUnpublish(id: string) {
    await fetch("/api/certificate/unpublish", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id }),
    });
    router.refresh();
  }

  return (
    <div className="panel span-2">
      <p className="kicker">Publish your certificate</p>
      <h3>Turn a certificate into a shareable badge</h3>
      <p className="muted small" style={{ marginBottom: 12 }}>
        Paste your signed certificate JSON (or upload the file). We verify its signature and give
        you a public link plus a badge to embed. Only the already-public certificate is stored —
        never your draft.
      </p>

      <form onSubmit={onPublish}>
        <div className="field">
          <label htmlFor="cert-json">Certificate JSON</label>
          <textarea
            id="cert-json"
            rows={4}
            value={json}
            onChange={(e) => setJson(e.target.value)}
            placeholder="Paste your Human Made certificate JSON…"
          />
        </div>
        <div className="field">
          <label htmlFor="cert-file">…or upload the file</label>
          <input id="cert-file" type="file" accept="application/json,.json" onChange={onFile} />
        </div>
        <div className="field">
          <label htmlFor="article-url">Article URL (optional)</label>
          <input
            id="article-url"
            type="url"
            value={articleUrl}
            onChange={(e) => setArticleUrl(e.target.value)}
            placeholder="https://…"
          />
        </div>
        <button className="btn primary" type="submit" disabled={busy || json.trim() === ""}>
          {busy ? "Publishing…" : "Publish certificate"}
        </button>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </form>

      {publishedId && (
        <div role="status" style={{ marginTop: 12 }}>
          <p className="muted small">
            Published! Public link:{" "}
            <a href={`/c/${publishedId}`} target="_blank" rel="noopener">
              {baseUrl}/c/{publishedId}
            </a>
          </p>
          <CopyButton value={badgeSnippet(baseUrl, publishedId)} label="Copy badge embed" />
        </div>
      )}

      {certificates.length > 0 && (
        <>
          <hr className="rule" />
          <p className="kicker">Your published certificates</p>
          <ul style={{ paddingLeft: 0, listStyle: "none" }}>
            {certificates.map((c) => (
              <li key={c.id} style={{ marginBottom: 12 }}>
                <a href={`/c/${c.id}`} target="_blank" rel="noopener">
                  {baseUrl}/c/{c.id}
                </a>
                {c.articleUrl && <span className="muted small"> · on {c.articleUrl}</span>}
                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  <CopyButton value={badgeSnippet(baseUrl, c.id)} label="Copy badge" />
                  <button type="button" className="btn" onClick={() => onUnpublish(c.id)}>
                    Unpublish
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
