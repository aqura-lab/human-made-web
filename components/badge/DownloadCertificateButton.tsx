"use client";

import type { SignedCertificate } from "@/lib/verify/verify";

// Downloads the (already-public) signed certificate JSON as a file, entirely
// client-side. No network call, no server round-trip — the data is already on
// the page. Mirrors the .btn styling from globals.css.
export function DownloadCertificateButton({
  signed,
  filename = "human-made-certificate.json",
}: {
  signed: SignedCertificate;
  filename?: string;
}) {
  function download() {
    const blob = new Blob([JSON.stringify(signed, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <button type="button" className="btn primary" onClick={download}>
      Download certificate
    </button>
  );
}
