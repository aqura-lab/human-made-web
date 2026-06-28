/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { DownloadCard } from "@/components/dashboard/DownloadCard";
import type { DownloadState } from "@/lib/release/gating";

describe("DownloadCard", () => {
  it("shows a coming-soon placeholder with no live download link when locked", () => {
    const state: DownloadState = { available: false, version: null, notes: null, sha256: null, url: null };
    render(<DownloadCard state={state} />);
    expect(screen.getByText(/coming soon/i)).toBeInTheDocument();
    const links = screen.queryAllByRole("link");
    expect(links).toHaveLength(0);
  });

  it("renders a download link and version when available", () => {
    const state: DownloadState = {
      available: true,
      version: "1.2.3",
      notes: "Bug fixes",
      sha256: "abc123",
      url: "https://blob.vercel.storage/humanmade-1.2.3.dmg",
    };
    render(<DownloadCard state={state} />);
    const link = screen.getByRole("link", { name: /download for mac/i });
    expect(link).toHaveAttribute("href", "/api/download");
    expect(screen.getByText(/v1\.2\.3/i)).toBeInTheDocument();
  });
});
