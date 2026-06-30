import Link from "next/link";
import { RainbowMark } from "@/components/craft/RainbowMark";

export function SiteHeader({ right }: { right?: React.ReactNode }) {
  return (
    <header className="site-header">
      <div className="wrap">
        <Link href="/" className="brand">
          <RainbowMark />
          Human Made<span className="dot">.</span>
        </Link>
        <nav className="nav">{right ?? <Link href="/login">Sign in</Link>}</nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wrap">
        Human Made certifies the observed writing process. It is not an AI detector, and it does not
        prove the absence of AI assistance. · <Link href="/privacy">Privacy</Link> ·{" "}
        <Link href="/terms">Terms</Link>
      </div>
    </footer>
  );
}
