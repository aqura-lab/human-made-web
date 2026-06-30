export function LoomEmbed({ embedUrl }: { embedUrl: string }) {
  return (
    <div className="panel span-2">
      <p className="kicker">Watch</p>
      <h3>How Human Made works</h3>
      <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, marginTop: 12 }}>
        <iframe
          src={embedUrl}
          title="Human Made explainer"
          allowFullScreen
          style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: 0 }}
        />
      </div>
    </div>
  );
}
