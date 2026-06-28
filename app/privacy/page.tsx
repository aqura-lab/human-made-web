import { SiteHeader, SiteFooter } from "@/components/Chrome";

export const metadata = { title: "Privacy Policy — Human Made" };

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main className="wrap narrow" style={{ paddingTop: 56 }}>
        <p className="kicker">Policy</p>
        <h1>Privacy Policy</h1>
        <p className="muted">
          Human Made is privacy-first. We collect only what we need to run the early-access
          programme.
        </p>
        <h3>What we store</h3>
        <p>
          Your name, email, the reason you gave for wanting access, your consent record, your queue
          position, and any feedback you submit. We never receive your draft text or keystrokes —
          those stay on your device in the desktop app. The certificate verifier on this site is
          stateless: pasted certificates and text are checked in memory and never stored or logged.
        </p>
        <h3>Your rights</h3>
        <p>
          From your account you can export all of your data as JSON, edit it, or delete your account.
          Deletion removes your personal data; any feedback you left is anonymised rather than lost.
        </p>
        <h3>Email</h3>
        <p>We email you only transactional sign-in links and essential service messages.</p>
      </main>
      <SiteFooter />
    </>
  );
}
