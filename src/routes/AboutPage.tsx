import { Link } from "react-router-dom";

const t = {
  bg: "oklch(0.16 0.006 260)",
  bg1: "oklch(0.19 0.007 260)",
  bg2: "oklch(0.22 0.008 260)",
  line: "oklch(0.29 0.008 260)",
  lineSoft: "oklch(0.24 0.008 260)",
  fg: "oklch(0.96 0.005 260)",
  fg1: "oklch(0.82 0.008 260)",
  fg2: "oklch(0.66 0.010 260)",
  fg3: "oklch(0.52 0.012 260)",
  fg4: "oklch(0.40 0.010 260)",
  accent: "oklch(0.78 0.17 300)",
  accentInk: "oklch(0.98 0.02 300)",
  accentSoft: "oklch(0.78 0.17 300 / 0.18)",
  accentGlow: "oklch(0.78 0.17 300 / 0.35)",
  mono: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
  sans: "'Inter', system-ui, -apple-system, sans-serif",
};

export function AboutPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: `radial-gradient(900px 500px at 80% -5%, oklch(0.78 0.17 300 / 0.10), transparent 60%), oklch(0.16 0.006 260)`,
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
            style={{
              fontFamily: t.mono,
              fontSize: 12,
              color: t.fg3,
              textDecoration: "none",
              padding: "6px 0",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = t.fg)}
            onMouseLeave={(e) => (e.currentTarget.style.color = t.fg3)}
          >
            ← back
          </Link>
        </div>
      </nav>

      {/* Content */}
      <main style={{ maxWidth: 720, margin: "0 auto", padding: "80px 28px 120px" }}>
        <div style={{ fontFamily: t.mono, fontSize: 11.5, color: t.accent, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12 }}>
          // about
        </div>

        <h1
          style={{
            fontFamily: t.sans,
            fontWeight: 800,
            fontSize: "clamp(36px, 5vw, 56px)",
            letterSpacing: "-0.03em",
            lineHeight: 1.05,
            margin: "0 0 32px",
            color: t.fg,
          }}
        >
          Why I built this.
        </h1>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 20,
            fontSize: 16,
            color: t.fg2,
            lineHeight: 1.7,
          }}
        >
          <p>
            I've been a developer for a while, and for most of that time my bookmark situation was
            embarrassing. Hundreds of tabs. A browser bookmarks folder I hadn't opened in two years.
            A Notion database I set up once and abandoned. Links sent to myself over Slack.
          </p>
          <p>
            Every time I wanted to re-find something — an article about async Rust I half-read three
            weeks ago, the repo for that one CLI tool a colleague mentioned — I'd spend ten minutes
            searching. And I'd usually just Google it again instead.
          </p>
          <p>
            The tools that exist are either built for a general audience (too much structure, too slow
            to save) or too minimal (no search, no tags, no way to tell a blog post from a GitHub
            repo). None of them felt like they were built for the way I actually work: keyboard-first,
            quick to save, quick to find.
          </p>
          <p>
            So I built DevLinks. Paste a URL, get the metadata back instantly, tag it, move on.
            When you need it again, search. That's the whole thing.
          </p>
          <p>
            It's opinionated. It's built for developers. And it's exactly what I wish had existed
            three years ago.
          </p>
        </div>

        {/* Author card */}
        <div
          style={{
            marginTop: 52,
            padding: 24,
            background: t.bg1,
            border: `1px solid ${t.lineSoft}`,
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            gap: 20,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: `linear-gradient(135deg, oklch(0.5 0.1 280), oklch(0.4 0.12 200))`,
              display: "grid",
              placeItems: "center",
              color: t.fg,
              fontFamily: t.mono,
              fontWeight: 700,
              fontSize: 16,
              flexShrink: 0,
            }}
          >
            H
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15, color: t.fg, marginBottom: 2 }}>Harshit Singh</div>
            <div style={{ fontFamily: t.mono, fontSize: 12, color: t.fg3, marginBottom: 8 }}>
              builder of devlinks
            </div>
            <a
              href="https://github.com/harshitsingh281125-stack"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontFamily: t.mono,
                fontSize: 12,
                color: t.accent,
                textDecoration: "none",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.75")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 .5A11.5 11.5 0 0 0 .5 12a11.5 11.5 0 0 0 7.86 10.92c.57.1.78-.25.78-.55v-2c-3.2.7-3.87-1.36-3.87-1.36-.52-1.32-1.28-1.67-1.28-1.67-1.04-.72.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.3-5.23-1.28-5.23-5.67 0-1.25.45-2.27 1.17-3.07-.12-.3-.51-1.47.11-3.06 0 0 .96-.3 3.15 1.17a10.9 10.9 0 0 1 5.74 0c2.19-1.47 3.15-1.17 3.15-1.17.62 1.59.23 2.76.11 3.06.73.8 1.17 1.82 1.17 3.07 0 4.4-2.69 5.36-5.25 5.64.41.36.78 1.05.78 2.12v3.14c0 .3.2.66.79.55A11.5 11.5 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5Z" />
              </svg>
              Find My Github !
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
