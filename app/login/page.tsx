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
          Enter the email you signed up with and we&apos;ll send you a fresh sign-in link.
        </p>
        <LoginForm />
      </main>
      <SiteFooter />
    </>
  );
}
