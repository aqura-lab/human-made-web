export const LOOM_SETTING_KEY = "loom_dashboard_url";

export function loomEmbedUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const m = raw.trim().match(/^https:\/\/www\.loom\.com\/(share|embed)\/([A-Za-z0-9]+)/);
  if (!m) return null;
  return `https://www.loom.com/embed/${m[2]}`;
}
