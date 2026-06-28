/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SignupForm } from "@/components/landing/SignupForm";

describe("SignupForm", () => {
  it("disables submit until all three consent boxes are ticked", async () => {
    const user = userEvent.setup();
    render(<SignupForm />);
    const submit = screen.getByRole("button", { name: /request early access/i });
    expect(submit).toBeDisabled();

    await user.type(screen.getByLabelText(/name/i), "Alberto");
    await user.type(screen.getByLabelText(/email/i), "a@example.com");
    expect(submit).toBeDisabled(); // consent still required

    await user.click(screen.getByLabelText(/data processing/i));
    await user.click(screen.getByLabelText(/terms/i));
    expect(submit).toBeDisabled(); // one consent still missing

    await user.click(screen.getByLabelText(/privacy/i));
    expect(submit).toBeEnabled();
  });

  it("links to the Terms and Privacy policies", () => {
    render(<SignupForm />);
    expect(screen.getByRole("link", { name: /terms/i })).toHaveAttribute("href", "/terms");
    expect(screen.getByRole("link", { name: /privacy/i })).toHaveAttribute("href", "/privacy");
  });

  it("frames the product as provenance, not an AI detector or 'humanity points' game", () => {
    const { container } = render(<SignupForm />);
    const text = container.textContent?.toLowerCase() ?? "";
    expect(text).toContain("not an ai detector");
    expect(text).not.toContain("humanity points");
    expect(text).not.toContain("most human");
  });
});
