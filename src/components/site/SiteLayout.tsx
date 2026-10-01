import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { GitHubMark } from "@/components/ui/BrandIcons";
import { Logo } from "@/components/ui/Logo";
import { ThemeSwitch } from "@/components/ui/ThemeSwitch";
import { AUTHOR_GITHUB, AUTHOR_NAME, CONTACT_EMAIL } from "@/lib/site";
import { cn } from "@/lib/utils";
import { SignInButton } from "./SignInButton";


type NavLink = { href: string; label: string };

function SiteHeader({ nav }: { nav: NavLink[] }) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);

  // Hairline appears once content scrolls under the header. IntersectionObserver,
  // not a scroll listener.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setScrolled(!entry.isIntersecting));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div ref={sentinelRef} aria-hidden="true" style={{ height: 1, marginBottom: -1 }} />
      <header className={cn("site-header", scrolled && "is-scrolled")}>
        <div className="container site-header-inner">
          <Link to="/" aria-label="DevLinks home">
            <Logo />
          </Link>
          <nav className="site-nav" aria-label="Primary">
            {nav.map((item) =>
              item.href.includes("#") ? (
                <a key={item.href} href={item.href}>
                  {item.label}
                </a>
              ) : (
                <Link key={item.href} to={item.href}>
                  {item.label}
                </Link>
              ),
            )}
          </nav>
          <div className="site-header-end">
            <SignInButton size="sm" />
          </div>
        </div>
      </header>
    </>
  );
}

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="site-footer-grid">
          <div>
            <Link to="/" aria-label="DevLinks home">
              <Logo />
            </Link>
            <p className="site-footer-note">A bookmark manager for developers, built by {AUTHOR_NAME}.</p>
          </div>
          <nav className="site-footer-links" aria-label="Footer">
            <Link to="/about">About</Link>
            <Link to="/privacy">Privacy</Link>
            <a href={`mailto:${CONTACT_EMAIL}`}>Contact</a>
            <a href={AUTHOR_GITHUB} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <GitHubMark size={13} />
              GitHub
            </a>
          </nav>
        </div>
        <div className="site-footer-bottom">
          <span>© {new Date().getFullYear()} {AUTHOR_NAME}</span>
          <ThemeSwitch />
        </div>
      </div>
    </footer>
  );
}

export function SiteLayout({ children, nav = [] }: { children: ReactNode; nav?: NavLink[] }) {
  return (
    <div className="site">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <SiteHeader nav={nav} />
      <main id="main" className="site-main" tabIndex={-1}>
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}

