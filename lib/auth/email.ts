// Transactional email for magic links. In production we send via Resend; in dev
// (no RESEND_API_KEY) we capture the link in an in-memory outbox and log it, so
// the flow is testable end-to-end without a mail provider.

type DevEmail = { to: string; url: string; at: number };

// Module-scoped; survives within a single server process (dev) / test run.
const devOutbox: DevEmail[] = [];

export function recordDevEmail(to: string, url: string): void {
  devOutbox.unshift({ to: to.toLowerCase(), url, at: Date.now() });
}

export function getLastDevLink(to: string): string | null {
  return devOutbox.find((e) => e.to === to.toLowerCase())?.url ?? null;
}

function emailHtml(url: string): string {
  return `
    <div style="font-family: Georgia, serif; color: #1a1a1a;">
      <h2 style="font-weight: normal;">Your Human Made sign-in link</h2>
      <p>Click to confirm your email and enter the early-access area. This link
      expires in 15 minutes and can be used once.</p>
      <p><a href="${url}" style="color: #b0291f;">Confirm and continue →</a></p>
      <p style="color:#666;font-size:13px;">Human Made certifies how your work was
      written. It is not an AI detector.</p>
    </div>`;
}

export async function sendMagicLink({ to, url }: { to: string; url: string }): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    recordDevEmail(to, url);
    console.log(`[dev magic link] ${to}: ${url}`);
    return;
  }
  const { Resend } = await import("resend");
  const resend = new Resend(apiKey);
  await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "Human Made <hello@humanmade.app>",
    to,
    subject: "Your Human Made sign-in link",
    html: emailHtml(url),
  });
}
