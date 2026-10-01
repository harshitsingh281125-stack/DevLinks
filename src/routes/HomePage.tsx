import { useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCheck,
  CircleCheck,
  ClipboardPaste,
  FileDown,
  Link2,
  Search,
  Shapes,
} from "lucide-react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { useAppSelector } from "@/app/hooks";
import { CollectionFeed } from "@/components/public/CollectionFeed";
import { SignInButton } from "@/components/site/SignInButton";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Favicon } from "@/components/ui/Favicon";
import { selectIsAuthenticated } from "@/features/auth/authSlice";
import { DEFAULT_AUTH_REDIRECT_PATH } from "@/features/auth/config";
import { useGetPublicFeedQuery } from "@/features/public/publicApi";
import { canonicalizeUrl } from "@/features/bookmarks/canonicalUrl";
import { serializeCollectionJson, serializeCollectionMarkdown } from "@/lib/export";
import { RESOURCE_TYPE_LABELS, resourceTypeLabel } from "@/lib/resourceTypes";
import type { Bookmark, Collection } from "@/lib/types";
import { RESOURCE_TYPES } from "@/lib/types";
import { DEMO_COLLECTIONS, DEMO_USER_ID, type SeedCollection } from "@/seed/demoData";
import { inferResourceType, inferSuggestedTags } from "@/server/taggingRules";

const NAV = [
  { href: "#explore", label: "Explore" },
  { href: "#how", label: "How it works" },
  { href: "#sharing", label: "Sharing" },
  { href: "#faq", label: "FAQ" },
];

const isApplePlatform = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.userAgent);

// ─── Live rules demo ──────────────────────────────────────────────────────────
// Runs the same canonicalization and classification code the app uses on save,
// entirely in the browser. On a real save the page title and description are
// fed to the rules too, so results there are usually richer.

const EXAMPLES = [
  "https://www.joshwcomeau.com/css/interactive-guide-to-flexbox/?utm_source=twitter#flex-direction",
  "https://github.com/vitejs/vite",
  "https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout",
  "https://egghead.io/courses/the-beginner-s-guide-to-react",
];

type Analysis =
  | { state: "empty" }
  | { state: "invalid" }
  | { state: "ok"; host: string; key: string; type: string; tags: string[]; ignored: string[] };

function analyze(raw: string): Analysis {
  const input = raw.trim();
  if (!input) return { state: "empty" };

  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`);
  } catch {
    return { state: "invalid" };
  }
  if (!url.hostname.includes(".")) return { state: "invalid" };

  const ignored: string[] = [];
  const protocol = input.match(/^https?:\/\//i)?.[0];
  if (protocol) ignored.push(protocol);
  const www = input.replace(/^https?:\/\//i, "").match(/^www\d*\./i)?.[0];
  if (www) ignored.push(www);
  const beforeQuery = input.replace(/[?#].*$/, "");
  if (/[^/]\/+$/.test(beforeQuery.replace(/^https?:\/\//i, ""))) ignored.push("trailing /");
  const query = input.match(/\?[^#]*/)?.[0];
  if (query) ignored.push(query);
  const hash = input.match(/#.*/)?.[0];
  if (hash) ignored.push(hash);

  return {
    state: "ok",
    host: url.hostname.replace(/^www\d*\./, ""),
    key: canonicalizeUrl(input),
    type: inferResourceType(url.hostname, url.pathname, null, null),
    tags: inferSuggestedTags(url.hostname, url.pathname, null, null),
    ignored,
  };
}

function RulesDemo() {
  const [value, setValue] = useState(EXAMPLES[0]);
  const result = useMemo(() => analyze(value), [value]);

  return (
    <div className="frame">
      <div className="demo-top">
        <form className="savebar" onSubmit={(e) => e.preventDefault()} noValidate>
          <Link2 size={17} strokeWidth={1.75} aria-hidden="true" />
          <input
            type="url"
            inputMode="url"
            name="demo-url"
            autoComplete="off"
            spellCheck={false}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Paste any link…"
            aria-label="Try a link"
          />
        </form>
        <div className="demo-examples">
          <span className="demo-examples-label">Try</span>
          {EXAMPLES.map((example) => {
            const host = new URL(example).hostname.replace(/^www\./, "");
            return (
              <button
                key={example}
                type="button"
                className="tag"
                aria-pressed={value === example}
                onClick={() => setValue(example)}
                translate="no"
              >
                {host}
              </button>
            );
          })}
        </div>
      </div>

      <dl className="readout" aria-live="polite">
        {result.state === "ok" ? (
          <div key={result.key + result.type} className="swap">
            <div className="readout-row">
              <dt>Saved as</dt>
              <dd>
                <span className="readout-key" translate="no">
                  {result.key}
                </span>
              </dd>
            </div>
            <div className="readout-row">
              <dt>Ignored</dt>
              <dd>
                {result.ignored.length > 0 ? (
                  result.ignored.map((part) => (
                    <span key={part} className="strip" title={part} translate="no">
                      {part.length > 28 ? `${part.slice(0, 27)}…` : part}
                    </span>
                  ))
                ) : (
                  <span className="readout-empty">Nothing, this link is already clean.</span>
                )}
              </dd>
            </div>
            <div className="readout-row">
              <dt>Type</dt>
              <dd>{resourceTypeLabel(result.type)}</dd>
            </div>
            <div className="readout-row">
              <dt>Suggested tags</dt>
              <dd>
                {result.tags.length > 0 ? (
                  result.tags.map((tag) => (
                    <span key={tag} className="tag">
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="readout-empty">None from the link alone. The page text usually adds some.</span>
                )}
              </dd>
            </div>
          </div>
        ) : (
          <div className="readout-row">
            <dt>Saved as</dt>
            <dd className="readout-empty">
              {result.state === "empty" ? "Paste a link to see how DevLinks files it." : "That doesn’t look like a link yet. Try https://react.dev/learn."}
            </dd>
          </div>
        )}
      </dl>

      <p className="demo-foot">
        This runs DevLinks’ real matching and tagging rules in your browser. Nothing is sent anywhere.
      </p>
    </div>
  );
}

// ─── Explore feed ─────────────────────────────────────────────────────────────

const FEED_PREVIEW_COUNT = 6;

function ExploreSection() {
  const { data = [], isLoading, isError } = useGetPublicFeedQuery();
  const hasMore = data.length > FEED_PREVIEW_COUNT;

  return (
    <section id="explore" className="section" aria-labelledby="explore-title">
      <div className="container">
        <div className="feed-head">
          <div>
            <h2 id="explore-title" className="h2">
              See what people are saving.
            </h2>
            <p className="body-lg">Every public collection on DevLinks, most recently updated first.</p>
          </div>
          <Link to="/explore" className="arrow-link">
            Browse all
            <ArrowRight size={15} strokeWidth={1.75} aria-hidden="true" />
          </Link>
        </div>
        <CollectionFeed
          items={data.slice(0, FEED_PREVIEW_COUNT)}
          isLoading={isLoading}
          isError={isError}
          emptyText="Be the first: sign in, build a collection, and flip it to public."
        />
        {hasMore ? (
          <div className="feed-foot">
            <Link to="/explore" className="btn btn-secondary">
              See all {data.length} collections
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}

// ─── How it works ─────────────────────────────────────────────────────────────

const DUPLICATE_VARIANTS = [
  "https://www.joshwcomeau.com/css/center-a-div/",
  "http://joshwcomeau.com/css/center-a-div?ref=newsletter",
  "https://joshwcomeau.com/css/center-a-div#flexbox",
];

function LoopSection() {
  const items = [
    {
      icon: ClipboardPaste,
      title: "Paste a link, review the preview",
      text: "The server reads the page’s title, description, favicon, and preview image. It gives up after 8 seconds and refuses private-network addresses. You can change anything before it’s saved.",
      visual: null,
    },
    {
      icon: Shapes,
      title: "Typed and tagged by rules, not a model",
      text: "Tags come first from the page itself: the ones its author declared on dev.to, GitHub, WordPress, and other platforms. A plain rule set fills in the rest from the title and description. Every suggestion is yours to keep or change.",
      visual: (
        <div className="bm-tags">
          {RESOURCE_TYPES.map((type) => (
            <span key={type} className="tag">
              {RESOURCE_TYPE_LABELS[type]}
            </span>
          ))}
        </div>
      ),
    },
    {
      icon: CheckCheck,
      title: "One link, one bookmark",
      text: "Links are compared without the protocol, www, query string, fragment, or trailing slash. A unique index in Postgres enforces it per account, so a second save points you to the first.",
      visual: (
        <div className="variants" translate="no">
          {DUPLICATE_VARIANTS.map((v) => (
            <span key={v}>{v}</span>
          ))}
          <span className="variants-result">
            <CircleCheck size={14} strokeWidth={2} aria-hidden="true" />
            {canonicalizeUrl(DUPLICATE_VARIANTS[0])}
          </span>
        </div>
      ),
    },
    {
      icon: Search,
      title: "Search that keeps its place",
      text: "Search covers titles, links, descriptions, tags, and types. Filters live in the address bar, so Back works and a filtered view can itself be bookmarked.",
      visual: (
        <div className="bm-tags" style={{ alignItems: "center" }}>
          <span className="kbd">{isApplePlatform ? "⌘ K" : "Ctrl K"}</span>
          <code className="tag" translate="no" style={{ fontFamily: "var(--mono)" }}>
            /app?q=hooks&amp;type=documentation&amp;tag=react
          </code>
        </div>
      ),
    },
  ];

  return (
    <section id="how" className="section" aria-labelledby="how-title">
      <div className="container loop-grid">
        <div className="loop-head">
          <h2 id="how-title" className="h2">
            Built around saving a link and finding it again.
          </h2>
          <p className="body-lg">
            Nothing else. No feeds, no read-later queue, no highlights. Just a fast way to keep the links
            you’ll need next month.
          </p>
        </div>
        <ol className="loop-list">
          {items.map(({ icon: Icon, title, text, visual }) => (
            <li key={title} className="loop-item">
              <span className="loop-icon">
                <Icon size={17} strokeWidth={1.75} aria-hidden="true" />
              </span>
              <div>
                <h3 className="loop-title">{title}</h3>
                <p className="loop-text">{text}</p>
                {visual ? <div className="loop-visual">{visual}</div> : null}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

// ─── Sharing ──────────────────────────────────────────────────────────────────

function ShareSection() {
  const featured = DEMO_COLLECTIONS[0];

  return (
    <section id="sharing" className="section" aria-labelledby="sharing-title">
      <div className="container share-grid">
        <div className="frame share-preview">
          <div className="frame-bar">
            <code translate="no">/public/collections/{featured.slug}</code>
          </div>
          <div className="share-head">
            <h3>{featured.name}</h3>
            <p>{featured.description}</p>
          </div>
          <ul>
            {featured.bookmarks.slice(0, 4).map((b) => (
              <li key={b.id}>
                <a className="pub-link" href={b.url} target="_blank" rel="noopener noreferrer">
                  <Favicon domain={b.domain} src={b.faviconUrl} />
                  <div>
                    <p className="pub-link-title">{b.title}</p>
                    <p className="pub-link-meta" translate="no">
                      {b.domain} · <span translate="yes">{RESOURCE_TYPE_LABELS[b.resourceType]}</span>
                    </p>
                  </div>
                  <ArrowUpRight className="pub-link-arrow" size={16} strokeWidth={1.75} aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="share-copy">
          <h2 id="sharing-title" className="h2">
            Share a collection with one switch.
          </h2>
          <p className="body-lg">
            Public pages are read-only, open without an account, and credit you with your profile.
            Postgres row-level security decides what’s visible, so a private collection stays private
            even if the app has a bug.
          </p>
          <Link to="/explore" className="arrow-link" style={{ marginTop: 24 }}>
            Browse public collections
            <ArrowRight size={15} strokeWidth={1.75} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

function toDemoBookmarks(collection: SeedCollection): { bookmarks: Bookmark[]; meta: Collection } {
  const savedAt = "2026-05-12T09:30:00.000Z";
  return {
    meta: {
      id: collection.id,
      userId: DEMO_USER_ID,
      name: collection.name,
      description: collection.description,
      slug: collection.slug,
      isPublic: true,
      isRoadmap: false,
      createdAt: savedAt,
      updatedAt: savedAt,
    },
    bookmarks: collection.bookmarks.slice(0, 3).map((b, i) => ({
      ...b,
      position: i + 1,
      userId: DEMO_USER_ID,
      normalizedUrl: canonicalizeUrl(b.url),
      searchText: "",
      createdAt: savedAt,
      updatedAt: savedAt,
    })),
  };
}

function ExportSection() {
  const [format, setFormat] = useState<"markdown" | "json">("markdown");
  const output = useMemo(() => {
    const { bookmarks, meta } = toDemoBookmarks(DEMO_COLLECTIONS[1]);
    return format === "markdown"
      ? serializeCollectionMarkdown(bookmarks, meta)
      : serializeCollectionJson(bookmarks, meta);
  }, [format]);

  return (
    <section className="section" aria-labelledby="export-title">
      <div className="container">
        <h2 id="export-title" className="h2" style={{ maxWidth: "18ch" }}>
          Your links leave when you do.
        </h2>
        <p className="body-lg">
          Export one collection, or everything, as Markdown or JSON straight from the dashboard. This is
          the real output for the first three links of a demo collection.
        </p>

        <div className="frame export-panel">
          <div className="frame-bar">
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <FileDown size={14} strokeWidth={1.75} aria-hidden="true" />
              <code translate="no">{format === "markdown" ? "css-layout.md" : "css-layout.json"}</code>
            </span>
            <div className="seg" role="group" aria-label="Export format">
              <button
                type="button"
                className="seg-item"
                aria-pressed={format === "markdown"}
                onClick={() => setFormat("markdown")}
              >
                Markdown
              </button>
              <button
                type="button"
                className="seg-item"
                aria-pressed={format === "json"}
                onClick={() => setFormat("json")}
              >
                JSON
              </button>
            </div>
          </div>
          <pre className="code" translate="no" tabIndex={0} aria-label={`${format} export preview`}>
            {output}
          </pre>
        </div>
      </div>
    </section>
  );
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────

const FAQS = [
  {
    q: "Who can see my bookmarks?",
    a: "Only you, unless you make a collection public. Every table has a row-level security policy tied to your account, so access is checked by the database itself.",
  },
  {
    q: "Does it use AI to tag links?",
    a: "No. Tags come from the page itself, like the tags an author set on dev.to or a repo’s GitHub topics, plus a readable rule set for the rest. You review every suggestion before anything is saved.",
  },
  {
    q: "Why only GitHub sign-in?",
    a: "DevLinks is built for developers, and GitHub means no new password to manage. Sign-in is handled by Supabase Auth.",
  },
  {
    q: "Can I import my existing bookmarks?",
    a: "Not yet. There’s no importer or browser extension, so links are added from the dashboard. Export already works for everything.",
  },
  {
    q: "What does it cost?",
    a: "Nothing. DevLinks is an independent project with no paid plan and no ads.",
  },
  {
    q: "What happens to a link that blocks previews?",
    a: "You can still save it. The dialog tells you what couldn’t be fetched and leaves the title for you to fill in.",
  },
];

function FaqSection() {
  return (
    <section id="faq" className="section" aria-labelledby="faq-title">
      <div className="container">
        <h2 id="faq-title" className="h2">
          Questions, answered plainly.
        </h2>
        <div className="faq-grid">
          {FAQS.map((item) => (
            <div key={item.q}>
              <h3 className="faq-q">{item.q}</h3>
              <p className="faq-a">{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function HomePage() {
  const [searchParams] = useSearchParams();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const requestedRedirect = searchParams.get("redirectTo") ?? DEFAULT_AUTH_REDIRECT_PATH;

  if (isAuthenticated) {
    return <Navigate to={requestedRedirect} replace />;
  }

  return (
    <SiteLayout nav={NAV}>
      <section className="hero" aria-labelledby="hero-title">
        <div className="container hero-grid">
          <div>
            <h1 id="hero-title" className="display reveal" style={{ "--i": 0 } as React.CSSProperties}>
              <span className="display-line">Save a link once.</span>{" "}
              <span className="display-line muted">Find it in seconds.</span>
            </h1>
            <p className="lede reveal" style={{ "--i": 1 } as React.CSSProperties}>
              Paste a URL. DevLinks fills in the title, type, and tags, and keeps it one search away.
            </p>
            <div className="hero-actions reveal" style={{ "--i": 2 } as React.CSSProperties}>
              <SignInButton size="lg" showError />
              <Link to="/explore" className="arrow-link">
                Browse public collections
                <ArrowRight size={15} strokeWidth={1.75} aria-hidden="true" />
              </Link>
            </div>
          </div>
          <div className="reveal" style={{ "--i": 3 } as React.CSSProperties}>
            <RulesDemo />
          </div>
        </div>
      </section>

      <ExploreSection />
      <LoopSection />
      <ShareSection />
      <ExportSection />
      <FaqSection />

      <section className="container" aria-labelledby="cta-title" style={{ marginTop: 8 }}>
        <div className="cta-band">
          <div>
            <h2 id="cta-title" className="h2">
              Start with one collection.
            </h2>
            <p>Sign in, name a collection, paste your first link. It takes about a minute.</p>
          </div>
          <SignInButton size="lg" />
        </div>
      </section>
    </SiteLayout>
  );
}
