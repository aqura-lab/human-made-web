"use client";
import { useState } from "react";
export function ReleaseToggle({ id, released }: { id: string; released: boolean }) {
  const [on, setOn] = useState(released);
  const [busy, setBusy] = useState(false);
  async function flip() {
    if (busy) return;
    const next = !on;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/users/release-download", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, released: next }),
      });
      if (res.ok) setOn(next);
    } finally {
      setBusy(false);
    }
  }
  return <button type="button" className="btn" aria-pressed={on} onClick={flip} disabled={busy}>{on ? "Released" : "Release"}</button>;
}
