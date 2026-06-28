/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { ReferralCard } from "@/components/dashboard/ReferralCard";
import { DownloadLocked } from "@/components/dashboard/DownloadLocked";

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

describe("DownloadLocked", () => {
  it("shows a coming-soon placeholder with no live download link", () => {
    render(<DownloadLocked />);
    expect(screen.getByText(/coming soon/i)).toBeInTheDocument();
    const links = screen.queryAllByRole("link");
    expect(links).toHaveLength(0);
  });
});
