import { SiteHeader, SiteFooter } from "@/components/Chrome";
import { SignupForm } from "@/components/landing/SignupForm";
import { Typewriter } from "@/components/craft/Typewriter";

export default async function LandingPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;

  return (
    <>
      <SiteHeader />
      <main className="wrap">
        <section className="hero">
          <div className="hero-grid">
            <div>
              <p className="kicker">Certify your craft&apos;s provenance</p>
              <h1 className="hero-display">
                <Typewriter />
              </h1>
              <p className="lede">
                AI detectors fail and treat writers unfairly. Heck, even Shakespeare gets
                flagged as AI written! You&apos;re tired of being accused of AI writing when
                you&apos;ve put your time, sweat and tears on it.
                Now you can prove where your work comes from.
                Human Made (Beta) is a privacy-preserving authorship certificate for
                writers: capture the process behind a piece as you write it, then hand skeptics a
                certificate they can verify themselves.
              </p>
              <p className="muted small">
                Built for writers first. Your raw text stays on your device. This is not an AI
                detector. It attests to what was observed while you wrote, and is honest about its
                limits.
              </p>
            </div>
            <div>
              <p className="kicker" style={{ marginBottom: 10 }}>
                Request beta access
              </p>
              <SignupForm referralCode={ref} />
            </div>
          </div>
        </section>

        <hr className="rule" />

        <section>
          <p className="kicker">How a certificate earns trust</p>
          <div className="card-grid">
            <div className="panel card">
              <p className="num">01. Capture</p>
              <h3>Write in your own tools</h3>
              <p className="muted small">
                The desktop app observes the writing process, things like typing, edits, pastes, dictation,
                without storing your raw text.
              </p>
            </div>
            <div className="panel card">
              <p className="num">02. Certify</p>
              <h3>Bind proof to the final text</h3>
              <p className="muted small">
                A certificate states what was observed, the policy tier earned, what it
                does and does not prove.
              </p>
            </div>
            <div className="panel card">
              <p className="num">03. Verify</p>
              <h3>Skeptics check it themselves</h3>
              <p className="muted small">
                Anyone can verify a certificate here or offline: its signature, registration, and text match
                without trusting you or seeing your drafts.
              </p>
            </div>
          </div>
        </section>

        <hr className="rule" />

        <section style={{ textAlign: "center" }}>
          <p className="kicker">Practice what we preach</p>
          <h3 style={{ maxWidth: "22ch", margin: "0 auto 14px" }}>
            Even this page was written by a human.
          </h3>
          <p className="muted small" style={{ maxWidth: "44ch", margin: "0 auto 18px" }}>
            The copy you just read was captured with Human Made. Here&apos;s its certificate —
            verify it yourself.
          </p>
          <a
            href="/c/90afd096-083b-4853-ba05-f2660d5dfc2a"
            target="_blank"
            rel="noopener"
            aria-label="View the Human Made certificate for this page"
          >
            {/* A plain <img> is the correct embed for the badge SVG endpoint, not next/image. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/api/badge/90afd096-083b-4853-ba05-f2660d5dfc2a"
              alt="Human Made — verified writing process"
              width={280}
              height={44}
            />
          </a>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
