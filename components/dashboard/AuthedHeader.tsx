import Link from "next/link";

export function AuthedHeader({ isAdmin }: { isAdmin?: boolean }) {
  return (
    <header className="site-header">
      <div className="wrap">
        <Link href="/dashboard" className="brand">
          Human Made<span className="dot">.</span>
        </Link>
        <nav className="nav">
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/account">Account</Link>
          <Link href="/community">Community</Link>
          {isAdmin && <Link href="/admin">Admin</Link>}
          <form action="/api/auth/logout" method="post" style={{ display: "inline" }}>
            <button
              type="submit"
              className="nav-signout"
              style={{
                background: "none",
                border: 0,
                cursor: "pointer",
                font: "inherit",
                color: "var(--ink-soft)",
                marginLeft: 22,
              }}
            >
              Sign out
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
