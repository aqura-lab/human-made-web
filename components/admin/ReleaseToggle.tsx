"use client";
import { useState } from "react";
export function ReleaseToggle({ id, released }: { id: string; released: boolean }) {
  const [on, setOn] = useState(released);
  async function flip() {
    const next = !on;
    await fetch("/api/admin/users/release-download", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, released: next }),
    });
    setOn(next);
  }
  return <button type="button" className="btn" aria-pressed={on} onClick={flip}>{on ? "Released" : "Release"}</button>;
}
