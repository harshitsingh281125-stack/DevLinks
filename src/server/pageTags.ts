import { metaContent, metaContents, parseAttributes, parseJsonLd, parseMetaTags, stripTags } from "./html";

// Tags the page itself declares, read from the places publishers put them.
// Sources are read in trust order; earlier sources win on ordering:
//
//   article:tag meta   Ghost (freeCodeCamp), WordPress/Yoast (CSS-Tricks)
//   JSON-LD keywords   most CMSes with structured data
//   "Tagged with ..."  Forem (dev.to) puts article tags in its description
//   /topics/ links     GitHub repository topics
//   rel="tag" links    WordPress themes, many blogs
//   meta keywords      low trust: often site-wide boilerplate, so filtered
//                      hard and capped
//
// Everything is normalized to one vocabulary so "React.js", "reactjs" and
// "#React" all become "react".

const MAX_PUBLISHER_TAGS = 6;
const MAX_KEYWORD_TAGS = 5;
export const MAX_SUGGESTED_TAGS = 8;

const ALIASES: Record<string, string> = {
  js: "javascript",
  es6: "javascript",
  ecmascript: "javascript",
  ts: "typescript",
  "react.js": "react",
  reactjs: "react",
  "react-js": "react",
  "vue.js": "vue",
  vuejs: "vue",
  "next.js": "nextjs",
  "next-js": "nextjs",
  "nuxt.js": "nuxt",
  nuxtjs: "nuxt",
  "node.js": "nodejs",
  node: "nodejs",
  "node-js": "nodejs",
  "nest.js": "nestjs",
  "express.js": "express",
  expressjs: "express",
  "svelte.js": "svelte",
  sveltekit: "svelte",
  golang: "go",
  k8s: "kubernetes",
  postgres: "postgresql",
  "c++": "cpp",
  "c#": "csharp",
  ".net": "dotnet",
  "asp.net": "dotnet",
  "tailwindcss": "tailwind",
  "tailwind-css": "tailwind",
  css3: "css",
  html5: "html",
  "web-development": "webdev",
  "web-dev": "webdev",
  "developer-tools": "devtools",
  "dev-tools": "devtools",
  ml: "machine-learning",
  "artificial-intelligence": "ai",
  llms: "llm",
  "large-language-models": "llm",
  "github-action": "github-actions",
  "ci/cd": "ci-cd",
  cicd: "ci-cd",
  "ux-design": "ux",
  "ui-design": "ui",
  a11y: "accessibility",
};

// Never useful as a tag, from any source.
const NOISE = new Set([
  "blog", "news", "article", "articles", "post", "posts", "home", "uncategorized", "featured",
  "general", "misc", "other", "latest", "popular", "trending", "tutorial", "tutorials", "page",
]);

// Additionally dropped from <meta keywords>, where sites list their own pitch.
const KEYWORD_BOILERPLATE = new Set([
  "software", "coding", "code", "development", "developer", "developers", "engineering", "engineer",
  "inclusive", "community", "programming", "programmer", "tech", "technology", "tips", "guide",
  "guides", "learn", "learning", "free", "online", "best", "how-to", "howto", "web", "internet",
  "computer", "computers", "it", "education", "resources", "documentation", "docs",
]);

/** Canonical tag slug, or null when the raw value isn't usable as a tag. */
export function normalizeTag(raw: string): string | null {
  let tag = stripTags(raw).toLowerCase().trim().replace(/^#+/, "").trim();
  if (!tag) return null;

  const direct = ALIASES[tag] ?? ALIASES[tag.replace(/\s+/g, "-")];
  if (direct) return direct;

  // Keep "." "+" "#" long enough to match aliases like "node.js" or "c++".
  const slug = tag.replace(/[\s_/]+/g, "-").replace(/[^a-z0-9.+#-]/g, "");
  tag = ALIASES[slug] ?? slug.replace(/[.+#]/g, "").replace(/-{2,}/g, "-").replace(/^-|-$/g, "");
  tag = ALIASES[tag] ?? tag;

  if (tag.length < 2 || tag.length > 32) return null;
  if (tag.split("-").length > 4) return null; // a phrase, not a tag
  if (/^\d+$/.test(tag)) return null;
  if (NOISE.has(tag)) return null;
  return tag;
}

function splitList(value: string): string[] {
  return value.includes(",") ? value.split(",") : value.split(/\s+/);
}

function jsonLdKeywords(blocks: unknown[]): string[] {
  const found: string[] = [];
  const visit = (node: unknown, depth: number) => {
    if (depth > 5 || node === null || typeof node !== "object") return;
    if (Array.isArray(node)) {
      node.forEach((n) => visit(n, depth + 1));
      return;
    }
    const record = node as Record<string, unknown>;
    const keywords = record.keywords;
    if (typeof keywords === "string") found.push(...splitList(keywords));
    else if (Array.isArray(keywords)) keywords.forEach((k) => typeof k === "string" && found.push(k));
    if (record["@graph"]) visit(record["@graph"], depth + 1);
  };
  blocks.forEach((b) => visit(b, 0));
  return found;
}

function taggedWith(description: string | null): string[] {
  const match = description?.match(/Tagged with ([^.]+)\.?\s*$/i);
  return match ? match[1].split(",") : [];
}

function githubTopics(html: string, hostname: string): string[] {
  if (hostname.replace(/^www\./, "") !== "github.com") return [];
  return [...html.matchAll(/href=["']\/topics\/([a-z0-9-]+)["']/gi)].map((m) => m[1]);
}

function relTagLinks(html: string): string[] {
  const tags: string[] = [];
  for (const match of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const attrs = parseAttributes(match[1]);
    if (attrs.rel?.split(/\s+/).includes("tag")) tags.push(match[2]);
  }
  return tags;
}

function addAll(into: string[], raws: string[], limit: number, extraStop?: Set<string>) {
  let added = 0;
  for (const raw of raws) {
    if (added >= limit || into.length >= MAX_PUBLISHER_TAGS) return;
    const tag = normalizeTag(raw);
    if (!tag || into.includes(tag) || extraStop?.has(tag)) continue;
    into.push(tag);
    added += 1;
  }
}

/** Tags declared by the page, most trustworthy first, at most six. */
export function extractPublisherTags(html: string, hostname: string): string[] {
  const meta = parseMetaTags(html);
  const tags: string[] = [];

  addAll(tags, metaContents(meta, "article:tag"), MAX_PUBLISHER_TAGS);
  addAll(tags, jsonLdKeywords(parseJsonLd(html)), MAX_PUBLISHER_TAGS);
  addAll(tags, taggedWith(metaContent(meta, "description")), MAX_PUBLISHER_TAGS);
  addAll(tags, githubTopics(html, hostname), MAX_PUBLISHER_TAGS);
  // rel="tag" links also appear in "related posts" sidebars, so they only
  // count when nothing more specific was declared.
  if (tags.length === 0) addAll(tags, relTagLinks(html), MAX_PUBLISHER_TAGS);
  // Keywords are low trust: boilerplate filtered, short phrases only, capped.
  addAll(
    tags,
    [...metaContents(meta, "news_keywords"), ...metaContents(meta, "keywords")]
      .flatMap(splitList)
      .filter((k) => k.trim().split(/\s+/).length <= 2),
    MAX_KEYWORD_TAGS,
    KEYWORD_BOILERPLATE,
  );

  return tags;
}

/** Publisher tags first (the author's own words), then rule-inferred ones. */
export function mergeSuggestedTags(publisher: string[], inferred: string[], limit = MAX_SUGGESTED_TAGS): string[] {
  const merged: string[] = [];
  for (const tag of [...publisher, ...inferred]) {
    const normalized = normalizeTag(tag);
    if (normalized && !merged.includes(normalized)) merged.push(normalized);
    if (merged.length >= limit) break;
  }
  return merged;
}
