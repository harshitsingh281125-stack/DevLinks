import { useEffect, useRef } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { useAppSelector } from "@/app/hooks";
import { selectIsAuthenticated } from "@/features/auth/authSlice";
import {
  buildAuthRedirectUrl,
  DEFAULT_AUTH_REDIRECT_PATH,
} from "@/features/auth/config";
import { useAuthActions } from "@/features/auth/useAuthActions";

// Design tokens matching the design file
const t = {
  bg: "oklch(0.16 0.006 260)",
  bg1: "oklch(0.19 0.007 260)",
  bg2: "oklch(0.22 0.008 260)",
  bg3: "oklch(0.26 0.009 260)",
  bgHi: "oklch(0.30 0.010 260)",
  line: "oklch(0.29 0.008 260)",
  lineSoft: "oklch(0.24 0.008 260)",
  lineHi: "oklch(0.40 0.010 260)",
  fg: "oklch(0.96 0.005 260)",
  fg1: "oklch(0.82 0.008 260)",
  fg2: "oklch(0.66 0.010 260)",
  fg3: "oklch(0.52 0.012 260)",
  fg4: "oklch(0.40 0.010 260)",
  accent: "oklch(0.78 0.17 300)",
  accentInk: "oklch(0.98 0.02 300)",
  accentSoft: "oklch(0.78 0.17 300 / 0.18)",
  accentGlow: "oklch(0.78 0.17 300 / 0.35)",
  danger: "oklch(0.72 0.18 25)",
  mono: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
  sans: "'Inter', system-ui, -apple-system, sans-serif",
};

function useTypewriter(
  ref: React.RefObject<HTMLSpanElement | null>,
  text: string,
  speed = 45,
  loopDelay = 2400,
) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let i = 0;
    let deleting = false;
    let timer: ReturnType<typeof setTimeout>;
    function tick() {
      if (!deleting) {
        el!.textContent = text.slice(0, ++i);
        if (i >= text.length) {
          deleting = true;
          timer = setTimeout(tick, loopDelay);
          return;
        }
      } else {
        el!.textContent = text.slice(0, --i);
        if (i <= 0) {
          deleting = false;
          timer = setTimeout(tick, 700);
          return;
        }
      }
      timer = setTimeout(tick, deleting ? 20 : speed + Math.random() * 30);
    }
    tick();
    return () => clearTimeout(timer);
  }, [ref, text, speed, loopDelay]);
}

function Caret({ small = false }: { small?: boolean }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: small ? 5 : 7,
        height: small ? 11 : 15,
        background: t.accent,
        verticalAlign: "-2px",
        marginLeft: 1,
        borderRadius: 1,
        animation: "devlinks-blink 1s infinite",
      }}
    />
  );
}

function Pill({
  children,
  solid,
  dashed,
}: {
  children: React.ReactNode;
  solid?: boolean;
  dashed?: boolean;
}) {
  return (
    <span
      style={{
        fontFamily: t.mono,
        fontSize: 11,
        padding: "2px 8px",
        background: solid ? t.accentSoft : "transparent",
        border: `1px ${dashed ? "dashed" : "solid"} ${solid ? t.accent : dashed ? t.fg3 : t.line}`,
        color: solid ? t.accent : dashed ? t.fg3 : t.fg2,
        borderRadius: 3,
      }}
    >
      {children}
    </span>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: t.mono,
        fontSize: 11.5,
        color: t.accent,
        textTransform: "uppercase",
        letterSpacing: "0.12em",
        marginBottom: 10,
      }}
    >
      {children}
    </div>
  );
}

function SectionHead({
  eyebrow,
  title,
  subtitle,
  center,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  center?: boolean;
}) {
  return (
    <div
      style={{
        maxWidth: 640,
        marginBottom: 52,
        ...(center
          ? { marginLeft: "auto", marginRight: "auto", textAlign: "center" }
          : {}),
      }}
    >
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2
        style={{
          fontFamily: t.sans,
          fontWeight: 700,
          fontSize: "clamp(30px, 4vw, 44px)",
          letterSpacing: "-0.02em",
          lineHeight: 1.1,
          margin: "0 0 14px",
          color: t.fg,
        }}
      >
        {title}
      </h2>
      {subtitle && (
        <p style={{ fontSize: 16, color: t.fg2, margin: 0, lineHeight: 1.55 }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

// ─── Nav ────────────────────────────────────────────────────────────────────

function Nav({
  onSignIn,
  isWorking,
}: {
  onSignIn: () => void;
  isWorking: boolean;
}) {
  return (
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
          display: "grid",
          gridTemplateColumns: "auto 1fr auto",
          alignItems: "center",
          gap: 32,
        }}
      >
        {/* Logo */}
        <a
          href="#"
          style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}
        >
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
        </a>

        {/* Nav links */}
        <div
          style={{
            display: "flex",
            gap: 24,
            justifyContent: "center",
            fontFamily: t.mono,
            fontSize: 12.5,
          }}
        >
          {["#features", "#flow", "#public", "#pricing"].map((href, i) => (
            <a
              key={href}
              href={href}
              style={{ color: t.fg2, textDecoration: "none", padding: "6px 0", whiteSpace: "nowrap" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = t.fg)}
              onMouseLeave={(e) => (e.currentTarget.style.color = t.fg2)}
            >
              {["Features", "How it works", "Share", "Pricing"][i]}
            </a>
          ))}
        </div>

        {/* CTAs */}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={onSignIn}
            disabled={isWorking}
            style={{
              background: "transparent",
              border: `1px solid ${t.line}`,
              color: t.fg1,
              padding: "6px 14px",
              borderRadius: 6,
              fontFamily: t.mono,
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            Sign in
          </button>
          <button
            onClick={onSignIn}
            disabled={isWorking}
            style={{
              background: t.accent,
              border: "none",
              color: t.accentInk,
              padding: "6px 14px",
              borderRadius: 6,
              fontFamily: t.mono,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            Get started <span>→</span>
          </button>
        </div>
      </div>
    </nav>
  );
}

// ─── Hero ────────────────────────────────────────────────────────────────────

function Hero({
  onSignIn,
  isWorking,
  errorMessage,
  requestedRedirect,
}: {
  onSignIn: () => void;
  isWorking: boolean;
  errorMessage: string | null;
  requestedRedirect: string;
}) {
  const typedRef = useRef<HTMLSpanElement>(null);
  useTypewriter(typedRef, "https://without.boats/blog/why-async-rust/", 38, 2200);

  useEffect(() => {
    const preview = document.getElementById("heroPreview");
    if (!preview) return;
    const t = setTimeout(() => preview.classList.add("dlp-show"), 1800);
    return () => clearTimeout(t);
  }, []);

  return (
    <header
      style={{
        position: "relative",
        padding: "56px 20px 40px",
        overflow: "hidden",
      }}
    >
      {/* Grid background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `linear-gradient(oklch(1 0 0 / 0.04) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0 / 0.04) 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
          WebkitMaskImage: "radial-gradient(ellipse at 50% 35%, black 0%, transparent 70%)",
          maskImage: "radial-gradient(ellipse at 50% 35%, black 0%, transparent 70%)",
          pointerEvents: "none",
        }}
        aria-hidden="true"
      />

      <div
        style={{
          position: "relative",
          maxWidth: 960,
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        {/* Kicker */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontFamily: t.mono,
            fontSize: 11.5,
            color: t.fg2,
            padding: "5px 12px",
            border: `1px solid ${t.lineSoft}`,
            background: t.bg1,
            borderRadius: 20,
            marginBottom: 24,
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: t.accent,
              boxShadow: `0 0 8px ${t.accentGlow}`,
              animation: "devlinks-blink 1.6s infinite",
              display: "inline-block",
            }}
          />
          v0.4.2 — now with public collections
        </div>

        {/* Title */}
        <h1
          style={{
            fontFamily: t.sans,
            fontWeight: 800,
            fontSize: "clamp(44px, 7vw, 84px)",
            lineHeight: 1.02,
            letterSpacing: "-0.03em",
            margin: "0 0 20px",
            color: t.fg,
          }}
        >
          Save every link.
          <br />
          <span style={{ color: t.accent, fontFamily: t.mono, fontWeight: 700, letterSpacing: "-0.02em" }}>
            Find it again.
          </span>
        </h1>

        <p
          style={{
            fontSize: 17,
            color: t.fg2,
            maxWidth: "58ch",
            margin: "0 auto 36px",
            lineHeight: 1.55,
          }}
        >
          A bookmark manager built the way developers actually work — paste, preview, tag, search, share.
          Your browser's bookmarks folder was never going to cut it.
        </p>

        {/* Demo window */}
        <div
          style={{
            maxWidth: 820,
            margin: "0 auto 36px",
            border: `1px solid ${t.line}`,
            borderRadius: 12,
            overflow: "hidden",
            background: t.bg1,
            boxShadow: `0 30px 80px oklch(0 0 0 / 0.5), 0 0 0 1px oklch(1 0 0 / 0.03) inset`,
            textAlign: "left",
          }}
        >
          {/* Chrome bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "10px 14px",
              background: t.bg2,
              borderBottom: `1px solid ${t.lineSoft}`,
              gap: 12,
            }}
          >
            <div style={{ display: "flex", gap: 6 }}>
              <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#e74c3c", display: "inline-block" }} />
              <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#f1c40f", display: "inline-block" }} />
              <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#2ecc71", display: "inline-block" }} />
            </div>
            <div
              style={{
                flex: 1,
                fontFamily: t.mono,
                fontSize: 12,
                color: t.fg2,
                textAlign: "center",
                padding: "4px 10px",
                background: t.bg1,
                border: `1px solid ${t.lineSoft}`,
                borderRadius: 4,
              }}
            >
              devlinks.dev / amira / learning-rust
            </div>
            <span
              style={{
                fontFamily: t.mono,
                fontSize: 11,
                color: t.fg3,
                background: t.bg3,
                padding: "2px 6px",
                borderRadius: 3,
                border: `1px solid ${t.lineSoft}`,
              }}
            >
              ⌘K
            </span>
          </div>

          {/* Body */}
          <div style={{ padding: 16 }}>
            {/* Add bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 14px",
                border: `1px solid ${t.accent}`,
                background: t.bg,
                borderRadius: 8,
                boxShadow: `0 0 0 3px ${t.accentSoft}`,
                fontFamily: t.mono,
                fontSize: 13,
              }}
            >
              <span style={{ color: t.accent, fontWeight: 600, flexShrink: 0 }}>$&nbsp;save</span>
              <span ref={typedRef} style={{ color: t.fg }} />
              <Caret />
              <span style={{ marginLeft: "auto", color: t.fg3, fontSize: 11 }}>
                <span
                  style={{
                    background: t.bg2,
                    padding: "1px 5px",
                    borderRadius: 3,
                    border: `1px solid ${t.lineSoft}`,
                  }}
                >
                  ⏎
                </span>
              </span>
            </div>

            {/* Preview card */}
            <div
              id="heroPreview"
              className="dlp-preview"
              style={{
                marginTop: 14,
                display: "grid",
                gridTemplateColumns: "56px 1fr auto",
                gap: 14,
                alignItems: "start",
                padding: 16,
                border: `1px solid ${t.line}`,
                background: t.bg,
                borderRadius: 8,
                opacity: 0,
                transform: "translateY(-4px)",
                transition: "opacity 300ms, transform 300ms",
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 8,
                  background: `linear-gradient(135deg, oklch(0.6 0.15 250), oklch(0.5 0.15 300))`,
                  color: "#fff",
                  fontFamily: t.mono,
                  fontWeight: 700,
                  fontSize: 22,
                  display: "grid",
                  placeItems: "center",
                }}
              >
                W
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: t.mono,
                    fontSize: 10.5,
                    color: t.accent,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    marginBottom: 6,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: t.accent,
                      animation: "devlinks-blink 1s infinite",
                      display: "inline-block",
                    }}
                  />
                  metadata ready
                </div>
                <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.01em", marginBottom: 4, color: t.fg }}>
                  Why Async Rust?
                </div>
                <div style={{ fontSize: 13, color: t.fg2, lineHeight: 1.5, marginBottom: 12 }}>
                  Reflections on the motivation behind Rust's async/await — cooperative multitasking, zero-cost abstractions, and the tradeoffs.
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontFamily: t.mono, fontSize: 10.5, color: t.fg4, textTransform: "uppercase", letterSpacing: "0.06em" }}>type</span>
                  <Pill solid>article</Pill>
                  <span style={{ fontFamily: t.mono, fontSize: 10.5, color: t.fg4, textTransform: "uppercase", letterSpacing: "0.06em" }}>tags</span>
                  <Pill>#rust</Pill>
                  <Pill>#async</Pill>
                  <Pill dashed>+ tokio</Pill>
                </div>
              </div>
              <div
                style={{
                  alignSelf: "center",
                  background: t.accent,
                  color: t.accentInk,
                  fontWeight: 600,
                  padding: "7px 14px",
                  borderRadius: 5,
                  fontSize: 12.5,
                  boxShadow: `0 2px 14px ${t.accentGlow}`,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  whiteSpace: "nowrap",
                }}
              >
                Save{" "}
                <span
                  style={{
                    background: "oklch(1 0 0 / 0.2)",
                    padding: "1px 5px",
                    borderRadius: 3,
                    fontFamily: t.mono,
                    fontSize: 10,
                  }}
                >
                  ⏎
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
          <button
            onClick={onSignIn}
            disabled={isWorking}
            style={{
              background: t.accent,
              border: "none",
              color: t.accentInk,
              padding: "11px 20px",
              borderRadius: 7,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: t.sans,
              boxShadow: `0 4px 24px ${t.accentGlow}`,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 .5A11.5 11.5 0 0 0 .5 12a11.5 11.5 0 0 0 7.86 10.92c.57.1.78-.25.78-.55v-2c-3.2.7-3.87-1.36-3.87-1.36-.52-1.32-1.28-1.67-1.28-1.67-1.04-.72.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.3-5.23-1.28-5.23-5.67 0-1.25.45-2.27 1.17-3.07-.12-.3-.51-1.47.11-3.06 0 0 .96-.3 3.15 1.17a10.9 10.9 0 0 1 5.74 0c2.19-1.47 3.15-1.17 3.15-1.17.62 1.59.23 2.76.11 3.06.73.8 1.17 1.82 1.17 3.07 0 4.4-2.69 5.36-5.25 5.64.41.36.78 1.05.78 2.12v3.14c0 .3.2.66.79.55A11.5 11.5 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5Z" />
            </svg>
            {isWorking ? "Redirecting…" : "Continue with GitHub"}
          </button>
          <span
            style={{
              width: "100%",
              textAlign: "center",
              fontFamily: t.mono,
              fontSize: 11.5,
              color: t.fg3,
              marginTop: 4,
            }}
          >
            Free while in beta · no credit card ·{" "}
            <span style={{ color: t.fg2 }}>{buildAuthRedirectUrl(requestedRedirect)}</span>
          </span>
        </div>

        {errorMessage && (
          <p style={{ marginTop: 16, fontSize: 13, color: "oklch(0.72 0.18 25)" }}>{errorMessage}</p>
        )}
      </div>
    </header>
  );
}

// ─── Stats strip ─────────────────────────────────────────────────────────────

function StatStrip() {
  const stats = [
    { k: "4,280+", v: "developers saving" },
    { k: "120k", v: "links organized" },
    { k: "9.4k", v: "public collections" },
    { k: "~40ms", v: "metadata fetch" },
  ];
  return (
    <div
      style={{
        borderTop: `1px solid ${t.lineSoft}`,
        borderBottom: `1px solid ${t.lineSoft}`,
        background: t.bg1,
        padding: "22px 20px",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 20,
        }}
      >
        {stats.map((s, i) => (
          <div
            key={s.k}
            style={{
              textAlign: "center",
              padding: "0 12px",
              borderRight: i < stats.length - 1 ? `1px dashed ${t.lineSoft}` : undefined,
            }}
          >
            <div style={{ fontFamily: t.mono, fontSize: 22, fontWeight: 700, color: t.fg, letterSpacing: "-0.01em" }}>
              {s.k}
            </div>
            <div style={{ fontFamily: t.mono, fontSize: 11, color: t.fg3, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 4 }}>
              {s.v}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Features ────────────────────────────────────────────────────────────────

function FeatCard({
  num,
  title,
  desc,
  span2,
  children,
}: {
  num: string;
  title: string;
  desc: string;
  span2?: boolean;
  children: React.ReactNode;
}) {
  return (
    <article
      style={{
        background: t.bg1,
        border: `1px solid ${t.lineSoft}`,
        borderRadius: 12,
        padding: 22,
        gridColumn: span2 ? "span 2" : undefined,
        transition: "border-color 160ms, transform 160ms",
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = t.lineHi;
        (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = t.lineSoft;
        (e.currentTarget as HTMLElement).style.transform = "";
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <span style={{ fontFamily: t.mono, fontSize: 11, color: t.accent, letterSpacing: "0.06em" }}>{num}</span>
        <h3 style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-0.01em", margin: 0, color: t.fg }}>{title}</h3>
      </div>
      <p style={{ fontSize: 13.5, color: t.fg2, lineHeight: 1.55, margin: "0 0 18px", maxWidth: "46ch" }}>{desc}</p>
      <div
        style={{
          background: t.bg,
          border: `1px solid ${t.lineSoft}`,
          borderRadius: 8,
          padding: 14,
          fontFamily: t.mono,
          fontSize: 12,
          color: t.fg1,
          minHeight: 140,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {children}
      </div>
    </article>
  );
}

function PasteDemoTyped() {
  const ref = useRef<HTMLSpanElement>(null);
  useTypewriter(ref, "tokio.rs/tokio/tutorial", 55, 2600);
  return <span ref={ref} style={{ color: t.fg }} />;
}

function SearchDemoTyped() {
  const ref = useRef<HTMLSpanElement>(null);
  useTypewriter(ref, "async rust", 80, 2200);
  return <span ref={ref} style={{ color: t.fg, flex: 1 }} />;
}

function FeaturesSection() {
  return (
    <section id="features" style={{ padding: "92px 20px", position: "relative" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <SectionHead
          eyebrow="// why another bookmark app"
          title="Browser bookmarks were built for 2004."
          subtitle="DevLinks is the flat-file, keyboard-first, dev-brain-shaped tool you've been wishing for."
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 16,
          }}
        >
          {/* 01 Paste Preview Save */}
          <FeatCard num="01" title="Paste. Preview. Save." desc="Metadata fetched instantly. Title, description, favicon, domain — all inferred before you hit enter.">
            <div style={{ display: "flex", alignItems: "center", padding: "8px 10px", background: t.bg1, border: `1px solid ${t.lineSoft}`, borderRadius: 5 }}>
              <span style={{ color: t.fg3 }}>https://</span>
              <PasteDemoTyped />
              <Caret small />
            </div>
            <div style={{ textAlign: "center", color: t.accent, fontSize: 14 }}>↓</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 10, background: t.bg1, border: `1px solid ${t.lineSoft}`, borderRadius: 5 }}>
              <div style={{ width: 32, height: 32, background: "#2b5fd9", color: "#fff", display: "grid", placeItems: "center", borderRadius: 5, fontWeight: 700, flexShrink: 0, fontFamily: t.mono }}>T</div>
              <div>
                <div style={{ fontSize: 12.5, color: t.fg, fontWeight: 500, fontFamily: t.sans }}>Tokio — Async Runtime for Rust</div>
                <div style={{ fontSize: 10.5, color: t.fg3, marginTop: 2 }}>tokio.rs · article · 2 min read</div>
              </div>
            </div>
          </FeatCard>

          {/* 02 Smart tags */}
          <FeatCard num="02" title="Smart tags, smart types." desc="DevLinks infers resource type and suggests topic tags from the page content. Accept, reject, edit — you stay in control.">
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ fontFamily: t.mono, fontSize: 10.5, color: t.fg4, textTransform: "uppercase", letterSpacing: "0.06em", minWidth: 40 }}>type</span>
              <div style={{ display: "flex", gap: 2, background: t.bg2, padding: 3, borderRadius: 5 }}>
                {["docs", "article", "video", "tool"].map((s) => (
                  <span
                    key={s}
                    style={{
                      padding: "3px 8px",
                      fontSize: 11,
                      color: s === "article" ? t.fg : t.fg3,
                      background: s === "article" ? t.bgHi : "transparent",
                      borderRadius: 3,
                    }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ fontFamily: t.mono, fontSize: 10.5, color: t.fg4, textTransform: "uppercase", letterSpacing: "0.06em", minWidth: 40 }}>tags</span>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                <Pill>#rust</Pill>
                <Pill>#async</Pill>
                <Pill dashed>+ tokio</Pill>
                <Pill dashed>+ runtime</Pill>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 10.5, color: t.fg3, marginTop: "auto", paddingTop: 6 }}>
              <span>ML confidence</span>
              <div style={{ flex: 1, height: 4, background: t.bg2, borderRadius: 2, overflow: "hidden" }}>
                <div style={{ width: "92%", height: "100%", background: `linear-gradient(90deg, ${t.accent}, oklch(0.85 0.17 135))`, borderRadius: 2 }} />
              </div>
              <span style={{ color: t.accent }}>92%</span>
            </div>
          </FeatCard>

          {/* 03 Duplicate detection */}
          <FeatCard num="03" title="Never save the same thing twice." desc="URLs are normalized per user — query params, trailing slashes, tracking junk all stripped — so duplicates are caught before they happen.">
            <pre style={{
              margin: 0, fontFamily: t.mono, fontSize: 11.5, color: t.fg1, lineHeight: 1.65,
              whiteSpace: "pre-wrap",
              overflowWrap: "anywhere",
              wordBreak: "break-word"
            }}>
              <span style={{ color: t.fg4 }}>{"// incoming\n"}</span>
              <span style={{ color: t.fg1 }}>
                {"doc.rust-lang.org/book/ch04.html?"}
                <span style={{ textDecoration: "line-through", color: t.danger, opacity: 0.7 }}>utm_source=twitter</span>
                {"\n"}
              </span>
              <span style={{ color: t.fg4 }}>{"// normalized\n"}</span>
              <span style={{ color: t.accent }}>{"doc.rust-lang.org/book/ch04.html\n"}</span>
              <span style={{ color: t.fg4 }}>{"// already saved 2 weeks ago ✓"}</span>
            </pre>
          </FeatCard>

          {/* 04 Search (spans 2) */}
          <FeatCard
            num="04"
            title="Search, filter, find — in that order."
            desc="Full-text search across titles, descriptions, domains, and tags. Stack filters for type, collection, and tag. URL-synced so back/forward work exactly the way you'd expect."
            span2
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: t.bg1, border: `1px solid ${t.accent}`, borderRadius: 5, boxShadow: `0 0 0 3px ${t.accentSoft}` }}>
              <span style={{ color: t.accent, fontSize: 14 }}>⌕</span>
              <SearchDemoTyped />
              <Caret small />
              <span style={{ fontSize: 10.5, color: t.fg3 }}>14 results</span>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              <Pill solid>type: article</Pill>
              <Pill solid>tag: rust</Pill>
              <Pill solid>tag: async</Pill>
              <span style={{ color: t.fg4, fontFamily: t.mono, fontSize: 11 }}>&amp;</span>
              <Pill dashed>+ filter</Pill>
            </div>
            {[
              { fav: { bg: "#c85e1a", label: "R" }, title: <>Pin and unsafe in <mark style={{ background: t.accentSoft, color: t.accent, padding: "0 2px", borderRadius: 2 }}>async</mark> Rust</>, domain: <>without.boats · <mark style={{ background: t.accentSoft, color: t.accent, padding: "0 2px", borderRadius: 2 }}>rust</mark> + async</> },
              { fav: { bg: `linear-gradient(135deg, oklch(0.6 0.15 250), oklch(0.5 0.15 300))`, label: "W" }, title: <>Why <mark style={{ background: t.accentSoft, color: t.accent, padding: "0 2px", borderRadius: 2 }}>Async</mark> <mark style={{ background: t.accentSoft, color: t.accent, padding: "0 2px", borderRadius: 2 }}>Rust</mark>?</>, domain: <>without.boats · article</> },
            ].map((r, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: t.bg1, border: `1px solid ${t.lineSoft}`, borderRadius: 5 }}>
                <div style={{ width: 28, height: 28, display: "grid", placeItems: "center", borderRadius: 5, fontWeight: 700, fontSize: 11, color: "#fff", flexShrink: 0, background: r.fav.bg, fontFamily: t.mono }}>
                  {r.fav.label}
                </div>
                <div>
                  <div style={{ fontSize: 12.5, fontFamily: t.sans, color: t.fg, fontWeight: 500 }}>{r.title}</div>
                  <div style={{ fontSize: 10.5, color: t.fg3, marginTop: 1, fontFamily: t.mono }}>{r.domain}</div>
                </div>
              </div>
            ))}
          </FeatCard>

          {/* 05 GitHub auth */}
          <FeatCard num="05" title="GitHub sign-in. Private by default." desc="Supabase Auth handles the hard parts. Every collection is private until you flip it public — your reading queue stays yours.">
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", background: "#0d1117", border: `1px solid ${t.line}`, borderRadius: 6, color: "#fff", fontSize: 13, fontFamily: t.sans, fontWeight: 500 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 .5A11.5 11.5 0 0 0 .5 12a11.5 11.5 0 0 0 7.86 10.92c.57.1.78-.25.78-.55v-2c-3.2.7-3.87-1.36-3.87-1.36-.52-1.32-1.28-1.67-1.28-1.67-1.04-.72.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.3-5.23-1.28-5.23-5.67 0-1.25.45-2.27 1.17-3.07-.12-.3-.51-1.47.11-3.06 0 0 .96-.3 3.15 1.17a10.9 10.9 0 0 1 5.74 0c2.19-1.47 3.15-1.17 3.15-1.17.62 1.59.23 2.76.11 3.06.73.8 1.17 1.82 1.17 3.07 0 4.4-2.69 5.36-5.25 5.64.41.36.78 1.05.78 2.12v3.14c0 .3.2.66.79.55A11.5 11.5 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5Z" />
                </svg>
                Continue with GitHub
              </div>
              <div style={{ fontSize: 10.5, color: t.fg3, textAlign: "center", marginTop: 12, fontFamily: t.mono }}>
                devlinks will receive: <b style={{ color: t.fg1, fontWeight: 600 }}>email</b>, <b style={{ color: t.fg1, fontWeight: 600 }}>profile</b>
              </div>
            </div>
          </FeatCard>
        </div>
      </div>
    </section>
  );
}

// ─── How it works ─────────────────────────────────────────────────────────────

function HowItWorksSection() {
  const steps = [
    {
      num: "01",
      title: "Paste a URL",
      desc: "Anywhere you are — dashboard, Cmd+K, browser extension.",
      demo: (
        <pre style={{ margin: 0, fontFamily: t.mono, fontSize: 11.5, background: t.bg, border: `1px solid ${t.lineSoft}`, padding: "8px 10px", borderRadius: 5, color: t.accent, overflowX: "auto" }}>
          $ devlinks save https://tokio.rs
        </pre>
      ),
    },
    {
      num: "02",
      title: "Review the preview",
      desc: "Title, description, type, tags — all pre-filled, all editable.",
      demo: (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: 8, background: t.bg, border: `1px solid ${t.lineSoft}`, borderRadius: 5 }}>
          <div style={{ width: 28, height: 28, background: "#2b5fd9", color: "#fff", borderRadius: 4, display: "grid", placeItems: "center", fontFamily: t.mono, fontWeight: 700, fontSize: 11, flexShrink: 0 }}>T</div>
          <div>
            <div style={{ fontSize: 12, color: t.fg, fontWeight: 500 }}>Tokio — Async Runtime</div>
            <div style={{ fontSize: 10.5, color: t.fg3, fontFamily: t.mono }}>tokio.rs</div>
          </div>
        </div>
      ),
    },
    {
      num: "03",
      title: "Drop it in a collection",
      desc: "One bookmark, one home. Create collections like git branches.",
      demo: (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {[
            { label: "learning-rust", color: "oklch(0.68 0.17 40)", active: false },
            { label: "rust-wasm", color: "oklch(0.72 0.16 280)", active: true },
            { label: "frontend", color: "oklch(0.78 0.15 200)", active: false },
          ].map((c) => (
            <div
              key={c.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 10px",
                background: c.active ? t.accentSoft : t.bg,
                border: `1px solid ${c.active ? t.accent : t.lineSoft}`,
                borderRadius: 5,
                fontFamily: t.mono,
                fontSize: 11.5,
                color: c.active ? t.accent : t.fg2,
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: c.color, flexShrink: 0, display: "inline-block" }} />
              {c.label}
            </div>
          ))}
        </div>
      ),
    },
    {
      num: "04",
      title: "Find it, later.",
      desc: "Search, filter, share. Your future self thanks you.",
      demo: (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: t.bg, border: `1px solid ${t.accent}`, borderRadius: 5, boxShadow: `0 0 0 3px ${t.accentSoft}`, fontFamily: t.mono, fontSize: 12 }}>
          <span style={{ color: t.accent }}>⌕</span>
          <span style={{ color: t.fg }}>async rust</span>
          <span style={{ marginLeft: "auto", fontSize: 10.5, padding: "1px 6px", borderRadius: 10, background: t.accent, color: t.accentInk, fontWeight: 600 }}>14</span>
        </div>
      ),
    },
  ];

  return (
    <section id="flow" style={{ padding: "92px 20px", position: "relative" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <SectionHead
          eyebrow="// the loop"
          title="Four steps. Zero friction."
          center
        />
        <ol
          style={{
            listStyle: "none",
            margin: 0,
            padding: 0,
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 18,
          }}
        >
          {steps.map((s) => (
            <li
              key={s.num}
              style={{
                background: t.bg1,
                border: `1px solid ${t.lineSoft}`,
                borderRadius: 12,
                padding: 22,
                position: "relative",
              }}
            >
              <div style={{ fontFamily: t.mono, fontSize: 11, color: t.accent, letterSpacing: "0.06em", marginBottom: 12 }}>{s.num}</div>
              <h4 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 6px", letterSpacing: "-0.01em", color: t.fg }}>{s.title}</h4>
              <p style={{ fontSize: 13, color: t.fg2, margin: "0 0 14px", lineHeight: 1.5 }}>{s.desc}</p>
              {s.demo}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

// ─── Public collections ──────────────────────────────────────────────────────

function PublicSection() {
  const rows = [
    { fav: { bg: "#c85e1a", label: "R" }, title: "The Rust Programming Language", domain: "doc.rust-lang.org · docs" },
    { fav: { bg: "#1a1a1a", label: "⌘" }, title: "tokio-rs/tokio", domain: "github.com · repo" },
    { fav: { bg: "#d4342f", label: "▶" }, title: "Crust of Rust: Lifetime Annotations", domain: "youtube.com · video" },
    { fav: { bg: `linear-gradient(135deg, oklch(0.6 0.15 250), oklch(0.5 0.15 300))`, label: "W" }, title: "Why Async Rust?", domain: "without.boats · article" },
    { fav: { bg: "#c85e1a", label: "R" }, title: "Understanding Ownership", domain: "doc.rust-lang.org · docs", muted: true },
  ];

  return (
    <section id="public" style={{ padding: "92px 20px", position: "relative" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center" }}>
        <div>
          <Eyebrow>// publish</Eyebrow>
          <h2 style={{ fontFamily: t.sans, fontWeight: 700, fontSize: "clamp(30px, 4vw, 44px)", letterSpacing: "-0.02em", lineHeight: 1.1, margin: "0 0 14px", color: t.fg }}>
            Make the good stuff findable.
          </h2>
          <p style={{ fontSize: 16, color: t.fg2, margin: 0, lineHeight: 1.55 }}>
            Flip any collection public and you get a clean, read-only share page — perfect for team onboarding, curated reading lists, or "here's everything I learned in Q1."
          </p>
          <ul style={{ listStyle: "none", margin: "24px 0 0", padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              "Read-only by default · no auth required to view",
              "Custom slug, open graph previews baked in",
              "Updates in real-time as you add links",
              "One-click revoke — never leaks beyond what you publish",
            ].map((b) => (
              <li key={b} style={{ display: "flex", gap: 10, color: t.fg1, fontSize: 14 }}>
                <span style={{ color: t.accent, fontWeight: 700, flexShrink: 0 }}>✓</span>
                {b}
              </li>
            ))}
          </ul>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 28, padding: "10px 12px 10px 10px", background: t.bg1, border: `1px solid ${t.line}`, borderRadius: 7, fontFamily: t.mono, fontSize: 12.5 }}>
            <span style={{ padding: "2px 7px", borderRadius: 4, background: t.accentSoft, color: t.accent, fontWeight: 700, fontSize: 10.5 }}>GET</span>
            <span style={{ color: t.fg2, flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>
              devlinks.dev/c/<b style={{ color: t.fg, fontWeight: 600 }}>learning-rust</b>
            </span>
            <button
              style={{ background: t.bg2, border: `1px solid ${t.lineSoft}`, color: t.fg1, padding: "4px 10px", borderRadius: 4, fontFamily: t.mono, fontSize: 11, cursor: "pointer" }}
              onClick={() => void navigator.clipboard.writeText("devlinks.dev/c/learning-rust")}
            >
              Copy
            </button>
          </div>
        </div>

        <div style={{ background: t.bg1, border: `1px solid ${t.line}`, borderRadius: 12, overflow: "hidden", boxShadow: `0 30px 60px oklch(0 0 0 / 0.4)` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: 18, borderBottom: `1px solid ${t.lineSoft}`, background: `linear-gradient(135deg, oklch(0.22 0.02 300 / 0.5), ${t.bg1})` }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: `linear-gradient(135deg, oklch(0.5 0.1 280), oklch(0.4 0.12 200))`, display: "grid", placeItems: "center", color: t.fg, fontFamily: t.mono, fontWeight: 700, fontSize: 13 }}>AM</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.01em", color: t.fg }}>Learning Rust</div>
              <div style={{ fontSize: 11.5, color: t.fg3, fontFamily: t.mono, marginTop: 2 }}>curated by <b style={{ color: t.accent, fontWeight: 400 }}>@amira</b> · 12 links</div>
            </div>
            <Pill solid>public</Pill>
          </div>
          <div style={{ padding: 10 }}>
            {rows.map((r, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 10px",
                  borderBottom: i < rows.length - 1 ? `1px solid ${t.lineSoft}` : undefined,
                  opacity: r.muted ? 0.6 : 1,
                }}
              >
                <div style={{ width: 32, height: 32, display: "grid", placeItems: "center", borderRadius: 5, color: "#fff", fontFamily: t.mono, fontWeight: 700, fontSize: 13, flexShrink: 0, background: r.fav.bg }}>
                  {r.fav.label}
                </div>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 500, color: t.fg }}>{r.title}</div>
                  <div style={{ fontSize: 11, color: t.fg3, fontFamily: t.mono, marginTop: 2 }}>{r.domain}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Pricing ─────────────────────────────────────────────────────────────────

function PricingSection({ onSignIn }: { onSignIn: () => void }) {
  const plans = [
    {
      name: "Hobby",
      price: "$0",
      featured: false,
      features: ["Unlimited bookmarks", "Up to 10 collections", "1 public collection", "Full-text search"],
      cta: { label: "Start free", primary: false },
    },
    {
      name: "Pro",
      badge: "beta",
      price: "$0",
      priceNote: "→ $6/mo",
      featured: true,
      features: ["Everything in Hobby", "Unlimited collections & public pages", "Browser extension + API", "Custom slugs + OG images", "Export to Markdown & JSON"],
      cta: { label: "Join the beta", primary: true },
    },
    {
      name: "Team",
      price: "Soon",
      featured: false,
      features: ["Shared collections", "Role-based permissions", "Team-branded share pages", "SSO (SAML, OIDC)"],
      cta: { label: "Get notified", primary: false, ghost: true },
    },
  ];

  return (
    <section id="pricing" style={{ padding: "92px 20px", position: "relative" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <SectionHead
          eyebrow="// pricing"
          title="Free now. Simple later."
          subtitle="DevLinks is in open beta. Everything is free."
          center
        />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {plans.map((p) => (
            <article
              key={p.name}
              style={{
                background: p.featured
                  ? `linear-gradient(180deg, ${t.accentSoft}, ${t.bg1} 40%)`
                  : t.bg1,
                border: `1px solid ${p.featured ? t.accent : t.lineSoft}`,
                borderRadius: 12,
                padding: 28,
                display: "flex",
                flexDirection: "column",
                gap: 18,
                boxShadow: p.featured ? `0 20px 60px oklch(0 0 0 / 0.3), 0 0 0 1px ${t.accentSoft}` : undefined,
                position: "relative",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <h3 style={{ fontSize: 16, margin: 0, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, color: t.fg }}>
                  {p.name}
                  {p.badge && (
                    <span style={{ fontFamily: t.mono, fontSize: 9.5, color: t.accent, border: `1px solid ${t.accent}`, padding: "1px 6px", borderRadius: 3, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 400 }}>
                      {p.badge}
                    </span>
                  )}
                </h3>
                <div style={{ fontFamily: t.mono, fontSize: 22, fontWeight: 700, letterSpacing: "-0.01em", color: t.fg }}>
                  {p.price}
                  {p.priceNote && (
                    <span style={{ fontSize: 11, color: t.fg4, textDecoration: "line-through", marginLeft: 4, fontWeight: 400 }}>{p.priceNote}</span>
                  )}
                </div>
              </div>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8, fontSize: 13.5, color: t.fg1, flex: 1 }}>
                {p.features.map((f) => (
                  <li key={f} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <span style={{ color: t.accent, fontWeight: 700, flexShrink: 0 }}>›</span>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={onSignIn}
                style={{
                  display: "flex",
                  width: "100%",
                  justifyContent: "center",
                  padding: 10,
                  background: p.cta.primary ? t.accent : p.cta.ghost ? "transparent" : t.bg2,
                  border: `1px solid ${p.cta.primary ? t.accent : p.cta.ghost ? t.line : t.lineSoft}`,
                  color: p.cta.primary ? t.accentInk : t.fg1,
                  borderRadius: 6,
                  fontFamily: t.sans,
                  fontSize: 13,
                  fontWeight: p.cta.primary ? 600 : 400,
                  cursor: "pointer",
                }}
              >
                {p.cta.label}
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── FAQ ─────────────────────────────────────────────────────────────────────

function FaqSection() {
  const faqs = [
    {
      q: "Do I need to install anything?",
      a: "No. DevLinks is a web app. A browser extension is on the roadmap for even faster saving, but the web app works great on its own — especially with ⌘K.",
    },
    {
      q: "Where is my data stored?",
      a: "Supabase (Postgres) in the EU. Your bookmarks are private until you explicitly publish a collection. Export any collection — or everything — to JSON or Markdown directly from the dashboard.",
    },
    {
      q: "Can I import from Pocket / Raindrop / browser bookmarks?",
      a: "Yes. HTML (browser), Pocket CSV, and Raindrop JSON imports are supported today. Pinboard and Instapaper are on the way.",
    },
    {
      q: "How is this different from Notion or Obsidian?",
      a: "Those are general-purpose. DevLinks is specifically shaped around the save-a-URL loop: duplicate detection, metadata fetching, type/tag inference, and fast search across a single flat index.",
    },
    {
      q: "Open source?",
      a: "The client is MIT-licensed and on GitHub. The hosted service runs the same code plus some infra glue.",
    },
  ];

  return (
    <section style={{ padding: "92px 20px", position: "relative" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "320px 1fr", gap: 60, alignItems: "start" }}>
        <SectionHead eyebrow="// frequently asked" title="The usual questions." />
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {faqs.map((f, i) => (
            <details
              key={f.q}
              open={i === 0}
              style={{ borderBottom: `1px solid ${t.lineSoft}`, padding: "16px 0", ...(i === 0 ? { borderTop: `1px solid ${t.lineSoft}` } : {}) }}
            >
              <summary
                style={{
                  cursor: "pointer",
                  listStyle: "none",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: 15,
                  fontWeight: 500,
                  letterSpacing: "-0.005em",
                  color: t.fg,
                  paddingRight: 24,
                  position: "relative",
                }}
              >
                {f.q}
              </summary>
              <p style={{ margin: "10px 0 0", color: t.fg2, fontSize: 14, lineHeight: 1.6, maxWidth: "64ch" }}>{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Final CTA ───────────────────────────────────────────────────────────────

function FinalCta({ onSignIn, isWorking }: { onSignIn: () => void; isWorking: boolean }) {
  const typedRef = useRef<HTMLSpanElement>(null);
  useTypewriter(typedRef, " login --with github", 55, 3200);

  return (
    <section
      style={{
        padding: "92px 20px",
        textAlign: "center",
        background: `radial-gradient(600px 300px at 50% 50%, ${t.accentSoft}, transparent 70%), ${t.bg}`,
        borderTop: `1px solid ${t.lineSoft}`,
        borderBottom: `1px solid ${t.lineSoft}`,
        position: "relative",
      }}
    >
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontFamily: t.mono,
            fontSize: 13,
            padding: "8px 14px",
            background: t.bg1,
            border: `1px solid ${t.line}`,
            borderRadius: 6,
            marginBottom: 20,
          }}
        >
          <span style={{ color: t.accent, fontWeight: 600 }}>$&nbsp;devlinks</span>
          <span ref={typedRef} style={{ color: t.fg }} />
          <Caret />
        </div>
        <h2 style={{ fontFamily: t.sans, fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 14px", color: t.fg }}>
          Your bookmarks deserve better.
        </h2>
        <p style={{ color: t.fg2, fontSize: 16, margin: "0 0 28px" }}>
          Two minutes to set up. Zero to migrate off — exports are a first-class feature.
        </p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
          <button
            onClick={onSignIn}
            disabled={isWorking}
            style={{
              background: t.accent,
              border: "none",
              color: t.accentInk,
              padding: "11px 20px",
              borderRadius: 7,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: t.sans,
              boxShadow: `0 4px 24px ${t.accentGlow}`,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 .5A11.5 11.5 0 0 0 .5 12a11.5 11.5 0 0 0 7.86 10.92c.57.1.78-.25.78-.55v-2c-3.2.7-3.87-1.36-3.87-1.36-.52-1.32-1.28-1.67-1.28-1.67-1.04-.72.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.3-5.23-1.28-5.23-5.67 0-1.25.45-2.27 1.17-3.07-.12-.3-.51-1.47.11-3.06 0 0 .96-.3 3.15 1.17a10.9 10.9 0 0 1 5.74 0c2.19-1.47 3.15-1.17 3.15-1.17.62 1.59.23 2.76.11 3.06.73.8 1.17 1.82 1.17 3.07 0 4.4-2.69 5.36-5.25 5.64.41.36.78 1.05.78 2.12v3.14c0 .3.2.66.79.55A11.5 11.5 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5Z" />
            </svg>
            {isWorking ? "Redirecting…" : "Continue with GitHub"}
          </button>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ──────────────────────────────────────────────────────────────────

function Footer() {
  const linkStyle = {
    display: "block" as const,
    color: t.fg1,
    textDecoration: "none",
    fontSize: 13.5,
    marginBottom: 8,
  };
  return (
    <footer style={{ padding: "50px 20px 30px", borderTop: `1px solid ${t.lineSoft}`, background: "oklch(0.14 0.006 260)" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "1.3fr 2fr", gap: 40 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 26, height: 26, borderRadius: 6, background: t.accent, color: t.accentInk, display: "grid", placeItems: "center", fontFamily: t.mono, fontWeight: 700, fontSize: 11, boxShadow: `0 0 0 1px oklch(0 0 0 / 0.5) inset, 0 2px 10px ${t.accentGlow}` }}>
              &gt;_
            </div>
            <span style={{ fontFamily: t.mono, fontWeight: 700, fontSize: 14, color: t.fg }}>
              dev<em style={{ fontStyle: "normal", color: t.accent }}>links</em>
            </span>
          </div>
          <p style={{ color: t.fg3, fontSize: 13, maxWidth: "34ch", margin: "12px 0 20px" }}>
            A bookmark manager built the way developers work.
          </p>
          <div style={{ fontFamily: t.mono, fontSize: 11, color: t.fg4 }}>© 2026 · Made in a terminal</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          <div>
            <h5 style={{ fontFamily: t.mono, fontSize: 10.5, color: t.fg3, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 14px", fontWeight: 500 }}>Product</h5>
            {(["#features", "#flow", "#pricing"] as const).map((href, i) => (
              <a key={href} href={href} style={linkStyle}
                onMouseEnter={(e) => (e.currentTarget.style.color = t.accent)}
                onMouseLeave={(e) => (e.currentTarget.style.color = t.fg1)}
              >
                {["Features", "How it works", "Pricing"][i]}
              </a>
            ))}
          </div>
          <div>
            <h5 style={{ fontFamily: t.mono, fontSize: 10.5, color: t.fg3, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 14px", fontWeight: 500 }}>Company</h5>
            <Link to="/about" style={linkStyle}
              onMouseEnter={(e) => (e.currentTarget.style.color = t.accent)}
              onMouseLeave={(e) => (e.currentTarget.style.color = t.fg1)}
            >About</Link>
            <Link to="/privacy" style={linkStyle}
              onMouseEnter={(e) => (e.currentTarget.style.color = t.accent)}
              onMouseLeave={(e) => (e.currentTarget.style.color = t.fg1)}
            >Privacy</Link>
            <a href="mailto:harshit.singh281125@gmail.com" style={linkStyle}
              onMouseEnter={(e) => (e.currentTarget.style.color = t.accent)}
              onMouseLeave={(e) => (e.currentTarget.style.color = t.fg1)}
            >Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── Root ────────────────────────────────────────────────────────────────────

export function HomePage() {
  const [searchParams] = useSearchParams();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const { errorMessage, isWorking, signInWithGitHub } = useAuthActions();
  const requestedRedirect = searchParams.get("redirectTo") ?? DEFAULT_AUTH_REDIRECT_PATH;

  const handleSignIn = () => void signInWithGitHub(requestedRedirect);

  if (isAuthenticated) {
    return <Navigate to={requestedRedirect} replace />;
  }

  return (
    <>
      {/* Keyframe injection */}
      <style>{`
        @keyframes devlinks-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .dlp-preview.dlp-show {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }
        details summary::-webkit-details-marker { display: none; }
        details summary::after {
          content: "+";
          position: absolute;
          right: 0;
          font-family: 'JetBrains Mono', monospace;
          font-size: 18px;
          color: oklch(0.52 0.012 260);
          transition: transform 200ms;
        }
        details[open] summary::after {
          content: "−";
          color: oklch(0.78 0.17 300);
        }
      `}</style>

      <div
        style={{
          minHeight: "100vh",
          background: `radial-gradient(900px 500px at 80% -5%, oklch(0.78 0.17 300 / 0.12), transparent 60%), radial-gradient(700px 420px at 10% 40%, oklch(0.6 0.2 280 / 0.08), transparent 60%), oklch(0.16 0.006 260)`,
          backgroundAttachment: "fixed",
          fontFamily: t.sans,
          color: t.fg,
        }}
      >
        <Nav onSignIn={handleSignIn} isWorking={isWorking} />
        <Hero
          onSignIn={handleSignIn}
          isWorking={isWorking}
          errorMessage={errorMessage}
          requestedRedirect={requestedRedirect}
        />
        <StatStrip />
        <FeaturesSection />
        <HowItWorksSection />
        <PublicSection />
        <PricingSection onSignIn={handleSignIn} />
        <FaqSection />
        <FinalCta onSignIn={handleSignIn} isWorking={isWorking} />
        <Footer />
      </div>
    </>
  );
}
