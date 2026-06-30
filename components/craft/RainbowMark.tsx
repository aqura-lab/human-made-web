// The Human Made brandmark — a small hand-drawn marker rainbow (concentric
// solid-colour arcs). Decorative: aria-hidden so it never alters the accessible
// name of whatever it sits inside (e.g. the "Human Made." brand link).

const ARCS: [string, number][] = [
  ["#7B2FBE", 10], ["#E23B2E", 8.2], ["#FF5FA2", 6.4], ["#1EA83C", 4.6], ["#1C4FD6", 2.8],
];

export function RainbowMark({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size * (16 / 24)}
      viewBox="0 0 24 16"
      aria-hidden="true"
      style={{ display: "inline-block", verticalAlign: "middle", marginRight: 8, flex: "0 0 auto" }}
    >
      <g fill="none" strokeWidth="1.8" strokeLinecap="round">
        {ARCS.map(([c, r]) => (
          <path key={c} d={`M${12 - r} 15 A ${r} ${r} 0 0 1 ${12 + r} 15`} stroke={c} />
        ))}
      </g>
    </svg>
  );
}
