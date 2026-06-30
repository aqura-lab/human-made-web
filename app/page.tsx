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
              <p className="kicker">Authorship, certified by process</p>
              <h1 className="hero-display">
                <Typewriter />
              </h1>
              <p className="lede">
                Not detected — demonstrated. A privacy-preserving authorship certificate for
                writers: capture the process behind a piece as you write it, then hand skeptics a
                certificate they can verify themselves, without ever exposing your drafts.
              </p>
              <p className="muted small">
                Built for journalists first. Your raw text stays on your device. This is not an AI
                detector — it attests to what was observed while you wrote, and is honest about its
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
              <p className="num">01 — Capture</p>
              <h3>Write in your own tools</h3>
              <p className="muted small">
                The desktop app observes the writing process — typing, edits, pastes, dictation —
                without storing your raw text.
              </p>
            </div>
            <div className="panel card">
              <p className="num">02 — Certify</p>
              <h3>Bind proof to the final text</h3>
              <p className="muted small">
                A certificate states what was observed, the policy tier earned, and exactly what it
                does and does not prove.
              </p>
            </div>
            <div className="panel card">
              <p className="num">03 — Verify</p>
              <h3>Skeptics check it themselves</h3>
              <p className="muted small">
                Anyone can verify a certificate offline — signature, registration, and text match —
                without trusting you or seeing your drafts.
              </p>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
