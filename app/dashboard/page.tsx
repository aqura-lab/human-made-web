import { requireUser, isAdmin } from "@/lib/auth/guards";
import { getDashboardData } from "@/lib/dashboard";
import { AuthedHeader } from "@/components/dashboard/AuthedHeader";
import { SiteFooter } from "@/components/Chrome";
import { ReferralCard } from "@/components/dashboard/ReferralCard";
import { CertificateVerifier } from "@/components/dashboard/CertificateVerifier";
import { FeedbackForm } from "@/components/dashboard/FeedbackForm";
import { DownloadCard } from "@/components/dashboard/DownloadCard";
import { getDownloadStateForUser } from "@/lib/release/store";

export default async function DashboardPage() {
  const user = await requireUser();
  const data = await getDashboardData(user.id);
  const download = await getDownloadStateForUser(user.id);

  return (
    <>
      <AuthedHeader isAdmin={isAdmin(user)} />
      <main className="wrap" style={{ paddingTop: 40 }}>
        <p className="kicker">Welcome back</p>
        <h1 style={{ marginBottom: 6 }}>Hi {data.name.split(" ")[0]}.</h1>

        <div className="dash-grid" style={{ marginTop: 18 }}>
          <div className="panel">
            <p className="kicker">Your place in line</p>
            {data.position !== null ? (
              <>
                <p className="bignum">#{data.position}</p>
                <p className="muted small">
                  We&apos;re onboarding journalists in small waves. Invite others to move up.
                </p>
              </>
            ) : (
              <>
                <p className="bignum">—</p>
                <p className="muted small">
                  Confirm your email from the link we sent to claim your spot in the queue.
                </p>
              </>
            )}
          </div>

          <ReferralCard
            link={data.referralLink}
            converted={data.converted}
            goal={data.goal}
            perkUnlocked={data.perkUnlocked}
          />

          <div className="panel span-2">
            <p className="kicker">Verify a certificate</p>
            <h3>Check any Human Made certificate</h3>
            <p className="muted small" style={{ marginBottom: 12 }}>
              Paste a certificate from an article to confirm its authorship claim — and, optionally,
              the published text to confirm it matches.
            </p>
            <CertificateVerifier />
          </div>

          <div className="panel">
            <p className="kicker">Shape the beta</p>
            <h3>Send feedback</h3>
            <FeedbackForm />
          </div>

          <DownloadCard state={download} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
