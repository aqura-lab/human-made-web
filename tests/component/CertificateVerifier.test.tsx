/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CertificateVerifier } from "@/components/dashboard/CertificateVerifier";

function mockFetchOnce(body: unknown, ok = true) {
  global.fetch = jest.fn().mockResolvedValue({
    ok,
    json: async () => body,
  }) as unknown as typeof fetch;
}

const validResult = {
  valid: true,
  registered: true,
  registrationState: "registered",
  textMatch: null,
  tier: { code: "no-bulk-paste", name: "No-Bulk-Paste" },
  verdict: { code: "eligible-with-disclosures", name: "Eligible with disclosures" },
  limitations: ["Does not prove the absence of AI assistance."],
};

describe("CertificateVerifier", () => {
  it("renders a valid result with tier, verdict and limitations", async () => {
    mockFetchOnce(validResult);
    const user = userEvent.setup();
    render(<CertificateVerifier />);
    await user.type(screen.getByLabelText(/certificate/i), '{{"certificate":1}');
    await user.click(screen.getByRole("button", { name: /verify/i }));

    expect(await screen.findByText(/valid/i)).toBeInTheDocument();
    expect(screen.getByText(/No-Bulk-Paste/)).toBeInTheDocument();
    expect(screen.getByText(/absence of AI assistance/i)).toBeInTheDocument();
  });

  it("shows an invalid state when the signature does not verify", async () => {
    mockFetchOnce({ ...validResult, valid: false, registered: false, reason: "bad sig" });
    const user = userEvent.setup();
    render(<CertificateVerifier />);
    await user.type(screen.getByLabelText(/certificate/i), "x");
    await user.click(screen.getByRole("button", { name: /verify/i }));

    expect(await screen.findByText(/not valid|invalid/i)).toBeInTheDocument();
  });

  it("always shows the non-detector disclaimer", () => {
    render(<CertificateVerifier />);
    expect(screen.getByText(/not an ai detector/i)).toBeInTheDocument();
  });
});
