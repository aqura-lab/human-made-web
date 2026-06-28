import { sendMagicLink, getLastDevLink } from "@/lib/auth/email";

describe("sendMagicLink (dev, no RESEND_API_KEY)", () => {
  const prev = process.env.RESEND_API_KEY;
  beforeAll(() => {
    delete process.env.RESEND_API_KEY;
  });
  afterAll(() => {
    if (prev) process.env.RESEND_API_KEY = prev;
  });

  it("captures the link in the dev outbox so it can be retrieved by email", async () => {
    const url = "http://localhost:3000/api/auth/callback?token=abc";
    await sendMagicLink({ to: "Dev@Example.com", url });
    expect(getLastDevLink("dev@example.com")).toBe(url);
  });

  it("returns null for an unknown recipient", () => {
    expect(getLastDevLink("nobody@example.com")).toBeNull();
  });
});
