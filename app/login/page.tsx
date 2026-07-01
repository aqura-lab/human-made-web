import { SiteHeader, SiteFooter } from "@/components/Chrome";
import { LoginForm } from "@/components/auth/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <>
      <SiteHeader />
      <main className="wrap narrow" style={{ paddingTop: 64 }}>
        <p className="kicker">Early access</p>
        <h1>Sign in</h1>
        {error === "expired" && (
          <p className="error">That link has expired or was already used. Request a new one below.</p>
        )}
        <p className="muted" style={{ marginBottom: 20 }}>
          Log in with your email and password. No password yet? Email yourself a one-time link
          instead, then set one from your account.
        </p>
        <LoginForm />
      </main>
      <SiteFooter />
    </>
  );
}
