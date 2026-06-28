// The Mac app download is gated until launch. Intentionally renders no live
// link — just a disabled "coming soon" placeholder.
export function DownloadLocked() {
  return (
    <div className="panel locked">
      <p className="kicker">Desktop app</p>
      <h3>Human Made for Mac</h3>
      <p className="muted small">
        The capture app is where you record the writing process behind a piece. We&apos;ll unlock your
        download here the moment your spot opens up.
      </p>
      <button className="btn" type="button" disabled aria-disabled="true">
        Coming soon
      </button>
    </div>
  );
}
