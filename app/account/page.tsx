import { requireUser, isAdmin } from "@/lib/auth/guards";
import { AuthedHeader } from "@/components/dashboard/AuthedHeader";
import { SiteFooter } from "@/components/Chrome";
import { EditProfile, DeleteAccount } from "@/components/account/AccountControls";

export const metadata = { title: "My Account — Human Made" };

export default async function AccountPage() {
  const user = await requireUser();

  return (
    <>
      <AuthedHeader isAdmin={isAdmin(user)} />
      <main className="wrap narrow" style={{ paddingTop: 40 }}>
        <p className="kicker">My account</p>
        <h1>{user.email}</h1>

        <div className="panel" style={{ marginTop: 16 }}>
          <h3>Edit your details</h3>
          <EditProfile name={user.name} reason={user.reason ?? ""} />
        </div>

        <div className="panel" style={{ marginTop: 16 }}>
          <h3>Export your data</h3>
          <p className="muted small">Download everything we hold about you as JSON.</p>
          <a className="btn" href="/api/account/export">
            Download my data
          </a>
        </div>

        <div className="panel" style={{ marginTop: 16 }}>
          <h3>Delete your account</h3>
          <DeleteAccount />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
