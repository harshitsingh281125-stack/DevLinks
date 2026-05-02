// ─── Demo seed data ───────────────────────────────────────────────────────────
//
// Three launch-ready public collections with real developer resources.
// Used by:
//   • supabase/seed.sql  (local dev reset via `supabase db reset`)
//   • scripts/seed-demo.ts (Admin API upsert for a live Supabase instance)
//
// IDs are deterministic UUIDs so re-running the seed is idempotent.

import type { KnownResourceType } from "@/lib/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SeedBookmark = {
  /** Deterministic UUID */
  id: string;
  /** Matches the parent SeedCollection.id */
  collectionId: string;
  title: string;
  url: string;
  description: string;
  domain: string;
  faviconUrl: string | null;
  imageUrl: string | null;
  resourceType: KnownResourceType;
  tags: string[];
};

export type SeedCollection = {
  /** Deterministic UUID */
  id: string;
  name: string;
  description: string;
  /** URL-safe slug; must be unique across all collections */
  slug: string;
  bookmarks: SeedBookmark[];
};

// ─── Demo user ────────────────────────────────────────────────────────────────

export const DEMO_USER_ID = "00000000-0000-0000-0000-000000000001";
export const DEMO_USER_EMAIL = "demo@devlinks.app";
export const DEMO_GITHUB_USERNAME = "devlinks-demo";
export const DEMO_DISPLAY_NAME = "DevLinks Demo";

// ─── Collection IDs ───────────────────────────────────────────────────────────

const REACT_DEBUGGING_COLLECTION_ID = "00000000-0000-0000-0001-000000000001";
const CSS_LAYOUT_COLLECTION_ID = "00000000-0000-0000-0001-000000000002";
const API_AUTH_COLLECTION_ID = "00000000-0000-0000-0001-000000000003";

// ─── React Debugging bookmarks ────────────────────────────────────────────────

const reactDebuggingBookmarks: SeedBookmark[] = [
  {
    id: "00000000-0000-0000-0002-000000000001",
    collectionId: REACT_DEBUGGING_COLLECTION_ID,
    title: "React Developer Tools",
    url: "https://react.dev/learn/react-developer-tools",
    description:
      "Install the official React DevTools browser extension to inspect component trees, props, state, and hooks in the browser.",
    domain: "react.dev",
    faviconUrl: null,
    imageUrl: null,
    resourceType: "tool",
    tags: ["react", "devtools", "debugging", "browser-extension"],
  },
  {
    id: "00000000-0000-0000-0002-000000000002",
    collectionId: REACT_DEBUGGING_COLLECTION_ID,
    title: "How to Use React DevTools",
    url: "https://www.freecodecamp.org/news/how-to-use-react-dev-tools/",
    description:
      "A practical walkthrough of React DevTools features: component inspection, props editing, profiler tab, and hunting down unnecessary re-renders.",
    domain: "freecodecamp.org",
    faviconUrl: null,
    imageUrl: null,
    resourceType: "article",
    tags: ["react", "debugging", "devtools", "performance"],
  },
  {
    id: "00000000-0000-0000-0002-000000000003",
    collectionId: REACT_DEBUGGING_COLLECTION_ID,
    title: "Error Boundaries — React Docs",
    url: "https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary",
    description:
      "Class component lifecycle method for catching render errors in subtrees. The de-facto pattern for graceful UI degradation in React.",
    domain: "react.dev",
    faviconUrl: null,
    imageUrl: null,
    resourceType: "documentation",
    tags: ["react", "error-handling", "error-boundary", "resilience"],
  },
  {
    id: "00000000-0000-0000-0002-000000000004",
    collectionId: REACT_DEBUGGING_COLLECTION_ID,
    title: "why-did-you-render",
    url: "https://github.com/welldone-software/why-did-you-render",
    description:
      "Monkey-patches React to notify you about avoidable re-renders. Invaluable for tracking down props/state equality issues causing excess work.",
    domain: "github.com",
    faviconUrl: null,
    imageUrl: null,
    resourceType: "repo",
    tags: ["react", "performance", "re-renders", "debugging"],
  },
  {
    id: "00000000-0000-0000-0002-000000000005",
    collectionId: REACT_DEBUGGING_COLLECTION_ID,
    title: "React Profiler API",
    url: "https://react.dev/reference/react/Profiler",
    description:
      "Built-in Profiler component for measuring render cost of any subtree programmatically. Works in production builds unlike the DevTools profiler.",
    domain: "react.dev",
    faviconUrl: null,
    imageUrl: null,
    resourceType: "documentation",
    tags: ["react", "performance", "profiling", "rendering"],
  },
  {
    id: "00000000-0000-0000-0002-000000000006",
    collectionId: REACT_DEBUGGING_COLLECTION_ID,
    title: "Fix the Slow Render Before You Fix the Re-render",
    url: "https://kentcdodds.com/blog/fix-the-slow-render-before-you-fix-the-re-render",
    description:
      "Kent C. Dodds argues that making individual renders fast matters more than eliminating them. A clear mental model shift for performance debugging.",
    domain: "kentcdodds.com",
    faviconUrl: null,
    imageUrl: null,
    resourceType: "article",
    tags: ["react", "performance", "optimization", "re-renders"],
  },
  {
    id: "00000000-0000-0000-0002-000000000007",
    collectionId: REACT_DEBUGGING_COLLECTION_ID,
    title: "A Visual Guide to React Rendering",
    url: "https://alexsidorenko.com/blog/react-render-always-rerenders/",
    description:
      "Animated diagrams showing exactly when and why React re-renders components. Covers the same-reference vs. new-object trap and context propagation.",
    domain: "alexsidorenko.com",
    faviconUrl: null,
    imageUrl: null,
    resourceType: "article",
    tags: ["react", "rendering", "mental-model", "visualization"],
  },
  {
    id: "00000000-0000-0000-0002-000000000008",
    collectionId: REACT_DEBUGGING_COLLECTION_ID,
    title: "React Strict Mode",
    url: "https://react.dev/reference/react/StrictMode",
    description:
      "Wraps subtrees to surface deprecated APIs, double-invoke effects, and detect accidental side effects during development. Enable it early.",
    domain: "react.dev",
    faviconUrl: null,
    imageUrl: null,
    resourceType: "documentation",
    tags: ["react", "strict-mode", "debugging", "best-practices"],
  },
];

// ─── CSS Layout bookmarks ─────────────────────────────────────────────────────

const cssLayoutBookmarks: SeedBookmark[] = [
  {
    id: "00000000-0000-0000-0002-000000000009",
    collectionId: CSS_LAYOUT_COLLECTION_ID,
    title: "A Complete Guide to CSS Grid",
    url: "https://css-tricks.com/snippets/css/complete-guide-grid/",
    description:
      "The definitive CSS Grid reference on CSS-Tricks. Covers every property with clear diagrams. Bookmark and consult constantly.",
    domain: "css-tricks.com",
    faviconUrl: null,
    imageUrl: null,
    resourceType: "article",
    tags: ["css", "grid", "layout", "reference"],
  },
  {
    id: "00000000-0000-0000-0002-000000000010",
    collectionId: CSS_LAYOUT_COLLECTION_ID,
    title: "A Complete Guide to Flexbox",
    url: "https://css-tricks.com/snippets/css/a-guide-to-flexbox/",
    description:
      "CSS-Tricks' canonical Flexbox reference. Container vs. item properties, axis visualisations, and real-world alignment patterns.",
    domain: "css-tricks.com",
    faviconUrl: null,
    imageUrl: null,
    resourceType: "article",
    tags: ["css", "flexbox", "layout", "reference"],
  },
  {
    id: "00000000-0000-0000-0002-000000000011",
    collectionId: CSS_LAYOUT_COLLECTION_ID,
    title: "Every Layout",
    url: "https://every-layout.dev",
    description:
      "Andy Bell and Heydon Pickering's collection of intrinsic, composable CSS layout primitives: Stack, Box, Center, Cluster, Sidebar, and more.",
    domain: "every-layout.dev",
    faviconUrl: null,
    imageUrl: null,
    resourceType: "course",
    tags: ["css", "layout", "design-patterns", "intrinsic"],
  },
  {
    id: "00000000-0000-0000-0002-000000000012",
    collectionId: CSS_LAYOUT_COLLECTION_ID,
    title: "Grid Garden",
    url: "https://cssgridgarden.com",
    description:
      "Learn CSS Grid by writing code to grow a carrot garden. 28 interactive levels covering grid-column, grid-row, grid-area, and span.",
    domain: "cssgridgarden.com",
    faviconUrl: null,
    imageUrl: null,
    resourceType: "tool",
    tags: ["css", "grid", "interactive", "learning"],
  },
  {
    id: "00000000-0000-0000-0002-000000000013",
    collectionId: CSS_LAYOUT_COLLECTION_ID,
    title: "Flexbox Froggy",
    url: "https://flexboxfroggy.com",
    description:
      "A game for learning CSS Flexbox. 24 levels that teach justify-content, align-items, flex-direction, flex-wrap, and flex-flow.",
    domain: "flexboxfroggy.com",
    faviconUrl: null,
    imageUrl: null,
    resourceType: "tool",
    tags: ["css", "flexbox", "interactive", "learning"],
  },
  {
    id: "00000000-0000-0000-0002-000000000014",
    collectionId: CSS_LAYOUT_COLLECTION_ID,
    title: "Understanding CSS Grid Lines",
    url: "https://www.smashingmagazine.com/2020/01/understanding-css-grid-lines/",
    description:
      "Rachel Andrew dives into named grid lines, implicit vs. explicit grids, and placement algorithms. Essential for mastering complex layouts.",
    domain: "smashingmagazine.com",
    faviconUrl: null,
    imageUrl: null,
    resourceType: "article",
    tags: ["css", "grid", "layout", "advanced"],
  },
  {
    id: "00000000-0000-0000-0002-000000000015",
    collectionId: CSS_LAYOUT_COLLECTION_ID,
    title: "CSS Container Queries",
    url: "https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries",
    description:
      "MDN reference for container queries — responsive design based on a parent container's size rather than the viewport. Now baseline across all browsers.",
    domain: "developer.mozilla.org",
    faviconUrl: null,
    imageUrl: null,
    resourceType: "documentation",
    tags: ["css", "container-queries", "responsive", "layout"],
  },
  {
    id: "00000000-0000-0000-0002-000000000016",
    collectionId: CSS_LAYOUT_COLLECTION_ID,
    title: "An Interactive Guide to CSS Grid",
    url: "https://www.joshwcomeau.com/css/interactive-guide-to-grid/",
    description:
      "Josh Comeau's signature interactive deep-dive into CSS Grid. Live playgrounds explain implicit/explicit tracks, auto-fill vs auto-fit, and subgrid.",
    domain: "joshwcomeau.com",
    faviconUrl: null,
    imageUrl: null,
    resourceType: "article",
    tags: ["css", "grid", "interactive", "deep-dive"],
  },
];

// ─── API / Auth bookmarks ─────────────────────────────────────────────────────

const apiAuthBookmarks: SeedBookmark[] = [
  {
    id: "00000000-0000-0000-0002-000000000017",
    collectionId: API_AUTH_COLLECTION_ID,
    title: "JWT.io Debugger",
    url: "https://jwt.io",
    description:
      "Paste any JWT to decode its header and payload, verify signatures with a secret or public key, and generate tokens for testing.",
    domain: "jwt.io",
    faviconUrl: null,
    imageUrl: null,
    resourceType: "tool",
    tags: ["jwt", "auth", "tokens", "debugging"],
  },
  {
    id: "00000000-0000-0000-0002-000000000018",
    collectionId: API_AUTH_COLLECTION_ID,
    title: "OAuth 2.0 Simplified",
    url: "https://www.oauth.com",
    description:
      "Aaron Parecki's authoritative guide to OAuth 2.0 flows: authorization code, PKCE, client credentials, device code, and token refresh.",
    domain: "oauth.com",
    faviconUrl: null,
    imageUrl: null,
    resourceType: "article",
    tags: ["oauth", "auth", "authorization", "security"],
  },
  {
    id: "00000000-0000-0000-0002-000000000019",
    collectionId: API_AUTH_COLLECTION_ID,
    title: "Supabase Auth Documentation",
    url: "https://supabase.com/docs/guides/auth",
    description:
      "Complete Supabase auth guide: email/password, magic links, OAuth providers (GitHub, Google), Row Level Security integration, and session management.",
    domain: "supabase.com",
    faviconUrl: null,
    imageUrl: null,
    resourceType: "documentation",
    tags: ["supabase", "auth", "oauth", "rls"],
  },
  {
    id: "00000000-0000-0000-0002-000000000020",
    collectionId: API_AUTH_COLLECTION_ID,
    title: "HTTP — MDN Overview",
    url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview",
    description:
      "Foundational MDN overview of the HTTP protocol: request/response cycle, methods, headers, status codes, caching, and cookies.",
    domain: "developer.mozilla.org",
    faviconUrl: null,
    imageUrl: null,
    resourceType: "documentation",
    tags: ["http", "api", "web", "fundamentals"],
  },
  {
    id: "00000000-0000-0000-0002-000000000021",
    collectionId: API_AUTH_COLLECTION_ID,
    title: "REST API Design Best Practices",
    url: "https://www.freecodecamp.org/news/rest-api-best-practices-rest-endpoint-design-examples/",
    description:
      "Practical guide to REST endpoint naming, HTTP method usage, versioning, error response shapes, and pagination conventions.",
    domain: "freecodecamp.org",
    faviconUrl: null,
    imageUrl: null,
    resourceType: "article",
    tags: ["rest", "api", "design", "best-practices"],
  },
  {
    id: "00000000-0000-0000-0002-000000000022",
    collectionId: API_AUTH_COLLECTION_ID,
    title: "HTTP Status Codes Reference",
    url: "https://httpstatuses.io",
    description:
      "Quick-reference for every HTTP status code with plain-language explanations. Essential when designing or debugging API responses.",
    domain: "httpstatuses.io",
    faviconUrl: null,
    imageUrl: null,
    resourceType: "documentation",
    tags: ["http", "status-codes", "api", "reference"],
  },
  {
    id: "00000000-0000-0000-0002-000000000023",
    collectionId: API_AUTH_COLLECTION_ID,
    title: "OWASP API Security Top 10",
    url: "https://owasp.org/www-project-api-security/",
    description:
      "The definitive list of the most critical API security risks: broken object-level auth, excessive data exposure, mass assignment, and more.",
    domain: "owasp.org",
    faviconUrl: null,
    imageUrl: null,
    resourceType: "documentation",
    tags: ["security", "api", "owasp", "best-practices"],
  },
  {
    id: "00000000-0000-0000-0002-000000000024",
    collectionId: API_AUTH_COLLECTION_ID,
    title: "Hoppscotch — Open Source API Client",
    url: "https://hoppscotch.io",
    description:
      "Browser-based API client supporting REST, GraphQL, WebSockets, and SSE. Useful for quickly testing endpoints without installing Postman.",
    domain: "hoppscotch.io",
    faviconUrl: null,
    imageUrl: null,
    resourceType: "tool",
    tags: ["api", "testing", "rest", "graphql"],
  },
];

// ─── Collections ──────────────────────────────────────────────────────────────

export const DEMO_COLLECTIONS: SeedCollection[] = [
  {
    id: REACT_DEBUGGING_COLLECTION_ID,
    name: "React Debugging",
    description:
      "Tools, patterns, and mental models for tracking down bugs and performance issues in React apps.",
    slug: "react-debugging",
    bookmarks: reactDebuggingBookmarks,
  },
  {
    id: CSS_LAYOUT_COLLECTION_ID,
    name: "CSS Layout",
    description:
      "The best references and interactive guides for mastering CSS Grid, Flexbox, and modern layout primitives.",
    slug: "css-layout",
    bookmarks: cssLayoutBookmarks,
  },
  {
    id: API_AUTH_COLLECTION_ID,
    name: "API / Auth",
    description:
      "Authoritative resources on REST API design, HTTP fundamentals, OAuth, JWT, and API security.",
    slug: "api-auth",
    bookmarks: apiAuthBookmarks,
  },
];

// ─── Flat accessors ───────────────────────────────────────────────────────────

export const ALL_DEMO_BOOKMARKS: SeedBookmark[] = DEMO_COLLECTIONS.flatMap(
  (c) => c.bookmarks,
);
