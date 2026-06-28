import type { DownloadState } from "@/lib/release/gating";

export function DownloadCard({ state }: { state: DownloadState }) {
  if (!state.available) {
    return (
      <div className="panel locked">
        <p className="kicker">Desktop app</p>
        <h3>Human Made for Mac</h3>
        <p className="muted small">
          The capture app is where you record the writing process behind a piece. We&apos;ll unlock your
          download here the moment your spot opens up.
        </p>
        <button className="btn" type="button" disabled aria-disabled="true">Coming soon</button>
      </div>
    );
  }
  return (
    <div className="panel">
      <p className="kicker">Desktop app</p>
      <h3>Human Made for Mac · v{state.version}</h3>
      {state.notes && <p className="muted small">{state.notes}</p>}
      <a className="btn" href="/api/download">Download for Mac</a>
      {state.sha256 && <p className="muted small mono" style={{ marginTop: 8 }}>SHA-256: {state.sha256}</p>}
    </div>
  );
}
