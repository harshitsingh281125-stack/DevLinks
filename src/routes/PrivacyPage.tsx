import { Link } from "react-router-dom";

const t = {
  bg: "oklch(0.16 0.006 260)",
  bg1: "oklch(0.19 0.007 260)",
  line: "oklch(0.29 0.008 260)",
  lineSoft: "oklch(0.24 0.008 260)",
  fg: "oklch(0.96 0.005 260)",
  fg1: "oklch(0.82 0.008 260)",
  fg2: "oklch(0.66 0.010 260)",
  fg3: "oklch(0.52 0.012 260)",
  accent: "oklch(0.78 0.17 300)",
  accentInk: "oklch(0.98 0.02 300)",
  accentSoft: "oklch(0.78 0.17 300 / 0.18)",
  accentGlow: "oklch(0.78 0.17 300 / 0.35)",
  mono: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
  sans: "'Inter', system-ui, -apple-system, sans-serif",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 40 }}>
      <h2
        style={{
          fontFamily: t.mono,
          fontSize: 13,
          fontWeight: 600,
          color: t.accent,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          margin: "0 0 12px",
        }}
      >
        {title}
      </h2>
      <div style={{ fontSize: 15, color: t.fg2, lineHeight: 1.7, display: "flex", flexDirection: "column", gap: 12 }}>
        {children}
      </div>
    </section>
  );
}

export function PrivacyPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "oklch(0.16 0.006 260)",
        fontFamily: t.sans,
        color: t.fg,
      }}
    >
      {/* Nav */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          backdropFilter: "blur(14px)",
          background: "oklch(0.16 0.006 260 / 0.72)",
          borderBottom: `1px solid ${t.lineSoft}`,
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "12px 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: 6,
                background: t.accent,
                color: t.accentInk,
                display: "grid",
                placeItems: "center",
                fontFamily: t.mono,
                fontWeight: 700,
                fontSize: 11,
                letterSpacing: -1,
                boxShadow: `0 0 0 1px oklch(0 0 0 / 0.5) inset, 0 2px 10px ${t.accentGlow}`,
              }}
            >
              &gt;_
            </div>
            <span style={{ fontFamily: t.mono, fontWeight: 700, fontSize: 14, color: t.fg }}>
              dev<em style={{ fontStyle: "normal", color: t.accent }}>links</em>
            </span>
          </Link>
          <Link
            to="/"
            style={{ fontFamily: t.mono, fontSize: 12, color: t.fg3, textDecoration: "none" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = t.fg)}
            onMouseLeave={(e) => (e.currentTarget.style.color = t.fg3)}
          >
            ← back
          </Link>
        </div>
      </nav>

      <main style={{ maxWidth: 720, margin: "0 auto", padding: "80px 28px 120px" }}>
        <div style={{ fontFamily: t.mono, fontSize: 11.5, color: t.accent, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12 }}>
          // privacy policy
        </div>
        <h1
          style={{
            fontFamily: t.sans,
            fontWeight: 800,
            fontSize: "clamp(32px, 5vw, 48px)",
            letterSpacing: "-0.03em",
            lineHeight: 1.05,
            margin: "0 0 8px",
            color: t.fg,
          }}
        >
          Your data is yours.
        </h1>
        <p style={{ fontSize: 13, fontFamily: t.mono, color: t.fg3, marginBottom: 48 }}>
          Last updated: May 2026
        </p>

        <Section title="What we collect">
          <p>
            When you sign in with GitHub, we receive your GitHub username, display name, and email
            address. We use these to create and identify your account — nothing else.
          </p>
          <p>
            We store the URLs you save along with the metadata we fetch for them (title, description,
            domain, favicon). We also store the tags and collections you create.
          </p>
        </Section>

        <Section title="What we don't collect">
          <p>
            We don't track your browsing history outside DevLinks. We don't sell your data. We don't
            run ads. We don't use third-party analytics that profile you across the web.
          </p>
        </Section>

        <Section title="Where your data lives">
          <p>
            Your data is stored in a Supabase Postgres database hosted in the EU. Authentication is
            handled by Supabase Auth. Neither we nor Supabase will sell or share your personal data
            with third parties.
          </p>
        </Section>

        <Section title="Public collections">
          <p>
            Collections are private by default. If you choose to make a collection public, its
            contents become visible to anyone with the link — no login required. You can revoke
            public access at any time and the page will immediately become inaccessible.
          </p>
        </Section>

        <Section title="Data export and deletion">
          <p>
            You can export all your bookmarks as JSON or Markdown at any time from your account
            settings. To permanently delete your account and all associated data, contact us at{" "}
            <a
              href="mailto:harshit.singh281125@gmail.com"
              style={{ color: t.accent, textDecoration: "none" }}
            >
              harshit.singh281125@gmail.com
            </a>{" "}
            and we'll process the request within 7 days.
          </p>
        </Section>

        <Section title="Cookies">
          <p>
            We use a single session cookie to keep you signed in. No tracking cookies. No
            third-party cookies.
          </p>
        </Section>

        <Section title="Changes to this policy">
          <p>
            If we make material changes to this policy, we'll update the date at the top of this
            page. Continued use of DevLinks after changes constitutes acceptance of the updated
            policy.
          </p>
        </Section>

        <div
          style={{
            marginTop: 48,
            padding: "16px 20px",
            background: t.bg1,
            border: `1px solid ${t.lineSoft}`,
            borderRadius: 8,
            fontFamily: t.mono,
            fontSize: 12.5,
            color: t.fg3,
          }}
        >
          Questions?{" "}
          <a href="mailto:harshit.singh281125@gmail.com" style={{ color: t.accent, textDecoration: "none" }}>
            harshit.singh281125@gmail.com
          </a>
        </div>
      </main>
    </div>
  );
}
