export type DownloadState = {
  available: boolean;
  version: string | null;
  notes: string | null;
  sha256: string | null;
  url: string | null;
};

export function decideDownload(input: {
  downloadReleasedAt: Date | null;
  release: { version: string; notes: string | null; sha256: string | null; blobUrl: string } | null;
}): DownloadState {
  const locked: DownloadState = { available: false, version: null, notes: null, sha256: null, url: null };
  if (!input.downloadReleasedAt || !input.release) return locked;
  const r = input.release;
  return { available: true, version: r.version, notes: r.notes, sha256: r.sha256, url: r.blobUrl };
}
