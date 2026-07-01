"use client";

import { useState } from "react";
import { upload } from "@vercel/blob/client";

export function ReleaseManager({ current }: { current: { version: string; fileName: string } | null }) {
  const [version, setVersion] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fileInput = e.currentTarget.elements.namedItem("dmg") as HTMLInputElement;
    const file = fileInput.files?.[0];
    if (!file || !version) return;
    setBusy(true);
    setStatus("Uploading…");
    try {
      // Blob pathnames reject spaces and other unsafe characters (a raw filename
      // like "Human Made 0.1.0 aarch64.dmg" 400s). Upload under a sanitized path;
      // keep the original name for display in the release record.
      const safeName = file.name.trim().replace(/\s+/g, "_").replace(/[^A-Za-z0-9._-]/g, "");
      const blob = await upload(safeName, file, {
        access: "public",
        handleUploadUrl: "/api/admin/release/upload",
      });
      const res = await fetch("/api/admin/release", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ version, fileName: file.name, blobUrl: blob.url, sizeBytes: file.size, notes }),
      });
      setStatus(res.ok ? `Published v${version}` : "Failed to save release");
    } catch (err) {
      setStatus(`Upload failed: ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onUpload} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {current && <p className="muted small">Current: {current.fileName} (v{current.version})</p>}
      <input aria-label="version" placeholder="Version e.g. 0.1.0" value={version} onChange={(e) => setVersion(e.target.value)} />
      <textarea aria-label="release notes" placeholder="Release notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
      <input aria-label="dmg file" name="dmg" type="file" accept=".dmg,application/x-apple-diskimage" />
      <button className="btn" type="submit" disabled={busy || !version}>{busy ? "Working…" : "Publish release"}</button>
      {status && <p className="muted small" role="status">{status}</p>}
    </form>
  );
}
