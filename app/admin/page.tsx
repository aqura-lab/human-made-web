import { requireAdmin } from "@/lib/auth/guards";
import { getAdminUsers, getAdminFeedback } from "@/lib/admin";
import { AuthedHeader } from "@/components/dashboard/AuthedHeader";
import { SiteFooter } from "@/components/Chrome";
import { FeedbackModeration } from "@/components/admin/FeedbackModeration";
import { ReleaseManager } from "@/components/admin/ReleaseManager";
import { ReleaseToggle } from "@/components/admin/ReleaseToggle";
import { LoomSetting } from "@/components/admin/LoomSetting";
import { getCurrentRelease } from "@/lib/release/store";
import { getSetting } from "@/lib/settings/store";
import { LOOM_SETTING_KEY } from "@/lib/settings/loom";

export const metadata = { title: "Admin — Human Made" };

export default async function AdminPage() {
  await requireAdmin(); // server-side gate (defense in depth beyond middleware)
  const [users, feedback, currentRelease, loom] = await Promise.all([getAdminUsers(), getAdminFeedback(), getCurrentRelease(), getSetting(LOOM_SETTING_KEY)]);

  return (
    <>
      <AuthedHeader isAdmin />
      <main className="wrap" style={{ paddingTop: 40 }}>
        <p className="kicker">Admin</p>
        <h1>Early-access control</h1>

        <div className="panel" style={{ marginTop: 16 }}>
          <h3>Release manager</h3>
          <ReleaseManager current={currentRelease ? { version: currentRelease.version, fileName: currentRelease.fileName } : null} />
        </div>

        <div className="panel" style={{ marginTop: 16 }}>
          <h3>Dashboard explainer video</h3>
          <LoomSetting current={loom} />
        </div>

        <div className="panel" style={{ marginTop: 16 }}>
          <h3>Waitlist · {users.length} signups</h3>
          <div style={{ overflowX: "auto" }}>
            <table className="users">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Email</th>
                  <th>Name</th>
                  <th>Joined</th>
                  <th>Verified</th>
                  <th>Referrals</th>
                  <th>Download</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.position ?? "—"}</td>
                    <td>{u.email}</td>
                    <td>{u.name}</td>
                    <td>{u.joinedAt.toISOString().slice(0, 10)}</td>
                    <td>{u.verified ? "yes" : "—"}</td>
                    <td>{u.referralCount}</td>
                    <td><ReleaseToggle id={u.id} released={u.downloadReleased} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel" style={{ marginTop: 16 }}>
          <h3>Feedback moderation</h3>
          <FeedbackModeration
            items={feedback.map((f) => ({ ...f, createdAt: f.createdAt.toISOString() }))}
          />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
