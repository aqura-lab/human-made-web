"use client";

import { useState } from "react";

// Private referrals only: the user sees their own link and their own progress.
// There is intentionally no leaderboard and no ranking of other users.
export function ReferralCard({
  link,
  converted,
  goal,
  perkUnlocked,
}: {
  link: string;
  converted: number;
  goal: number;
  perkUnlocked: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const pct = Math.min(100, Math.round((converted / goal) * 100));

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard may be unavailable; the input is selectable as a fallback */
    }
  }

  return (
    <div className="panel">
      <p className="kicker">Invite &amp; move up</p>
      <h3>Your referral link</h3>
      <p className="muted small">
        Each friend who joins and confirms their email moves <em>you</em> up the queue. Invite {goal}{" "}
        and your first year is on us.
      </p>
      <div style={{ display: "flex", gap: 8, margin: "10px 0" }}>
        <input className="code-pill" style={{ flex: 1 }} readOnly value={link} />
        <button className="btn" type="button" onClick={copy}>
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <div className="progress" aria-hidden>
        <span style={{ width: `${pct}%` }} />
      </div>
      <p className="muted small" style={{ marginTop: 8 }}>
        {perkUnlocked ? (
          <strong>✦ Unlocked — your first year is free.</strong>
        ) : (
          <>
            {converted} of {goal} invited
          </>
        )}
      </p>
    </div>
  );
}
