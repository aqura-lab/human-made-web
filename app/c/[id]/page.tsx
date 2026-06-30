import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader, SiteFooter } from "@/components/Chrome";
import { CertificateVerifier } from "@/components/dashboard/CertificateVerifier";
import { DownloadCertificateButton } from "@/components/badge/DownloadCertificateButton";
import { getPublishedCertificate, isValidCertificateId } from "@/lib/certificate/registry";
import {
  verifySignature,
  verifyRegistration,
  TIER_NAME,
  VERDICT_NAME,
} from "@/lib/verify/verify";

export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "Human Made — Certificate",
  description:
    "View and verify a Human Made authorship certificate. Provenance over prediction; privacy by default. Not an AI detector.",
};

// Shared "what is this / how verification works" explainer. Public, on-brand,
// honest about limits. Links to deeper docs (privacy/terms) that exist today.
function Explainer() {
  return (
    <section className="panel" style={{ marginTop: 24 }}>
      <p className="kicker">What is this?</p>
      <h3>A certificate of how a piece was written</h3>
      <p className="muted small">
        A Human Made certificate attests to the <em>observed writing process</em> behind a piece —
        captured on the author&apos;s device by the Human Made desktop app. It records process
        signals (typing, edits, pastes, dictation) and binds them to a hash of the final text. It is
        about <strong>provenance, not prediction</strong>: it is <em>not</em> an AI detector and does
        not produce an &ldquo;AI probability&rdquo; score.
      </p>
      <p className="muted small" style={{ marginTop: 10 }}>
        <strong>Privacy by default.</strong> The author&apos;s raw drafts and keystrokes never leave
        their device and are never stored here. A certificate carries only the signed claim and a
        one-way hash of the final text — never the text itself.
      </p>
      <p className="muted small" style={{ marginTop: 10 }}>
        <strong>How verification works.</strong> Each certificate is signed with an Ed25519 key.
        Anyone can check, fully offline, that (1) the signature is valid and unaltered, (2) the
        tamper-evident registration receipt matches, and (3) — if you paste the published text — its
        hash matches the certified text. You don&apos;t have to trust the author, or us.
      </p>
      <p className="muted small" style={{ marginTop: 10 }}>
        <Link href="/privacy">Privacy</Link> · <Link href="/terms">Terms</Link>
      </p>
    </section>
  );
}

export default async function PublicCertificatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const validId = isValidCertificateId(id);
  const record = validId ? await getPublishedCertificate(id) : null;

  return (
    <>
      <SiteHeader right={<Link href="/">About Human Made</Link>} />
      <main className="wrap narrow" style={{ paddingTop: 40, paddingBottom: 8 }}>
        <p className="kicker">Human Made certificate</p>

        {record ? (
          <FoundCertificate record={record} />
        ) : (
          <NotFoundCertificate id={id} validId={validId} />
        )}

        <Explainer />
      </main>
      <SiteFooter />
    </>
  );
}

function FoundCertificate({
  record,
}: {
  record: NonNullable<Awaited<ReturnType<typeof getPublishedCertificate>>>;
}) {
  const { signed } = record;
  const cert = signed.certificate;
  const sig = verifySignature(signed);
  const reg = verifyRegistration(signed);

  return (
    <>
      <h1 style={{ marginBottom: 6 }}>This piece records a human writing process.</h1>
      <p className="muted small" style={{ marginBottom: 16, maxWidth: "54ch" }}>
        Below is the narrow claim this certificate makes. It attests to the observed process — it
        does not prove the absence of AI assistance.
      </p>

      <div className="panel">
        <p style={{ marginBottom: 12 }}>
          <span className={`stamp ${sig.ok ? "ok" : "bad"}`}>
            <span aria-hidden="true">{sig.ok ? "✓" : "✕"}</span>
            {sig.ok ? "Signature valid" : "Not valid"}
          </span>
        </p>
        <p>
          <span className={`badge ${reg.state === "registered" ? "ok" : "warn"}`}>
            {reg.state === "registered"
              ? "Registered"
              : reg.state === "mismatch"
                ? "Registration mismatch"
                : "Not registered"}
          </span>
        </p>
        <p className="tier" style={{ marginTop: 10 }}>
          Tier: <strong>{TIER_NAME[cert.granted_tier]}</strong> · {VERDICT_NAME[cert.verdict]}
        </p>
        {cert.label && (
          <p className="muted small" style={{ marginTop: 6 }}>
            {cert.label}
          </p>
        )}
        <p className="muted small mono" style={{ marginTop: 10 }}>
          ID: {cert.id}
        </p>
        <p className="muted small mono">Issued: {cert.issued_at}</p>
        {record.articleUrl && (
          <p className="muted small" style={{ marginTop: 6 }}>
            Published on:{" "}
            <a href={record.articleUrl} rel="nofollow noopener">
              {record.articleUrl}
            </a>
          </p>
        )}

        {(cert.limitations?.length ?? 0) > 0 && (
          <>
            <p className="muted small" style={{ marginTop: 12 }}>
              What this does <em>not</em> prove:
            </p>
            <ul>
              {cert.limitations!.map((l, i) => (
                <li key={i} className="lim">
                  {l}
                </li>
              ))}
            </ul>
          </>
        )}

        <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <DownloadCertificateButton signed={signed} filename={`human-made-${cert.id}.json`} />
          <a className="btn" href="#verify">
            Verify it yourself
          </a>
        </div>
      </div>

      <section id="verify" className="panel" style={{ marginTop: 18 }}>
        <p className="kicker">Verify</p>
        <h3>Check this certificate offline</h3>
        <p className="muted small" style={{ marginBottom: 12 }}>
          Download the certificate above and paste it here, then optionally paste the published text
          to confirm it matches the certified text. Verification runs against the signature — nothing
          is stored.
        </p>
        <CertificateVerifier />
      </section>
    </>
  );
}

function NotFoundCertificate({ id, validId }: { id: string; validId: boolean }) {
  return (
    <>
      <h1 style={{ marginBottom: 6 }}>This certificate isn&apos;t on the registry.</h1>
      <p className="muted small" style={{ marginBottom: 16, maxWidth: "56ch" }}>
        We couldn&apos;t locate a published certificate for this link
        {validId ? (
          <>
            {" "}
            (<span className="mono">{id}</span>)
          </>
        ) : null}
        . That doesn&apos;t mean a piece is suspect — Human Made never stores authors&apos;
        certificates or drafts on our servers, so a certificate can only be confirmed by verifying it
        directly. If the author shared their certificate file with you, you can verify it below.
      </p>

      <section className="panel" id="verify">
        <p className="kicker">Verify</p>
        <h3>Verify a certificate yourself</h3>
        <p className="muted small" style={{ marginBottom: 12 }}>
          Paste a Human Made certificate (JSON) to confirm its signature — and, optionally, the
          published text to confirm it matches the certified text. This runs offline and stores
          nothing.
        </p>
        <CertificateVerifier />
      </section>
    </>
  );
}
