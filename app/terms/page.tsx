import { SiteHeader, SiteFooter } from "@/components/Chrome";

export const metadata = { title: "Terms & Conditions — Human Made" };

export default function TermsPage() {
  return (
    <>
      <SiteHeader />
      <main className="wrap narrow" style={{ paddingTop: 56 }}>
        <p className="kicker">Policy</p>
        <h1>Terms &amp; Conditions</h1>
        <p className="muted">Plain-language terms for the Human Made beta.</p>
        <h3>What the certificate claims</h3>
        <p>
          A Human Made certificate attests to the writing process that was observed under a stated
          policy tier. It is <strong>not</strong> an AI detector and does not claim to prove the
          absence of AI assistance. Verifiers should read each certificate&apos;s stated limitations.
        </p>
        <h3>Beta software</h3>
        <p>
          This is pre-release software offered for evaluation. Features may change and availability is
          not guaranteed. Don&apos;t rely on it as your sole evidence in a high-stakes dispute yet.
        </p>
        <h3>Acceptable use</h3>
        <p>Don&apos;t attempt to forge certificates or misrepresent what a certificate proves.</p>
      </main>
      <SiteFooter />
    </>
  );
}
