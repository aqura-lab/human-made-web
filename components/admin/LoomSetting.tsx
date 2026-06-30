"use client";
import { useState } from "react";
import { LOOM_SETTING_KEY } from "@/lib/settings/loom";

export function LoomSetting({ current }: { current: string | null }) {
  const [value, setValue] = useState(current ?? "");
  const [status, setStatus] = useState<string | null>(null);
  async function save() {
    const res = await fetch("/api/admin/settings", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ key: LOOM_SETTING_KEY, value }),
    });
    setStatus(res.ok ? "Saved" : "Failed");
  }
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <input aria-label="loom url" placeholder="https://www.loom.com/share/…" value={value} onChange={(e) => setValue(e.target.value)} style={{ flex: 1 }} />
      <button className="btn" type="button" onClick={save}>Save</button>
      {status && <span className="muted small" role="status">{status}</span>}
    </div>
  );
}
