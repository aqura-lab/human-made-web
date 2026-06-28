/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { ReferralCard } from "@/components/dashboard/ReferralCard";
import { DownloadCard } from "@/components/dashboard/DownloadCard";

describe("ReferralCard", () => {
  const link = "https://humanmade.app/?ref=abc123";

  it("shows the user's own link and private progress, no leaderboard", () => {
    render(<ReferralCard link={link} converted={3} goal={5} perkUnlocked={false} />);
    expect(screen.getByDisplayValue(link)).toBeInTheDocument();
    expect(screen.getByText(/3 of 5/i)).toBeInTheDocument();
    const text = document.body.textContent?.toLowerCase() ?? "";
    expect(text).not.toContain("leaderboard");
    expect(text).not.toContain("most invites");
    expect(text).not.toContain("most human");
  });

  it("celebrates the unlocked perk", () => {
    render(<ReferralCard link={link} converted={5} goal={5} perkUnlocked />);
    expect(screen.getByText(/1 year free|unlocked/i)).toBeInTheDocument();
  });
});

describe("DownloadCard", () => {
  it("shows a coming-soon placeholder with no live download link when locked", () => {
    render(<DownloadCard state={{ available: false, version: null, notes: null, sha256: null, url: null }} />);
    expect(screen.getByText(/coming soon/i)).toBeInTheDocument();
    const links = screen.queryAllByRole("link");
    expect(links).toHaveLength(0);
  });
});
