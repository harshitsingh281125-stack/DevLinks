import type { KnownResourceType } from "../lib/types";

// ─── Resource-type inference ──────────────────────────────────────────────────

export function inferResourceType(
  hostname: string,
  pathname: string,
  title: string | null,
  description: string | null,
): KnownResourceType {
  const host = hostname.toLowerCase();
  const path = pathname.toLowerCase();
  const text = `${title ?? ""} ${description ?? ""}`.toLowerCase();

  // 1. Video hosting platforms
  if (
    host === "youtube.com" ||
    host === "www.youtube.com" ||
    host === "youtu.be" ||
    host === "vimeo.com" ||
    host === "www.vimeo.com" ||
    host === "loom.com" ||
    host === "www.loom.com" ||
    host === "wistia.com" ||
    host === "fast.wistia.com"
  ) {
    return "video";
  }

  // 2. Podcast platforms
  if (
    host === "podcasts.apple.com" ||
    host === "overcast.fm" ||
    host === "pocketcasts.com" ||
    host === "player.fm" ||
    host === "changelog.com" ||
    (host.includes("spotify.com") && path.includes("/episode/"))
  ) {
    return "podcast";
  }

  // 3. Course platforms
  if (
    host === "udemy.com" ||
    host === "www.udemy.com" ||
    host === "coursera.org" ||
    host === "www.coursera.org" ||
    host === "egghead.io" ||
    host === "frontendmasters.com" ||
    host === "pluralsight.com" ||
    host === "scrimba.com" ||
    host === "codecademy.com" ||
    host === "www.codecademy.com" ||
    host === "skillshare.com" ||
    (host === "linkedin.com" && path.startsWith("/learning/"))
  ) {
    return "course";
  }

  // 4. Package registries → tool
  if (
    host === "npmjs.com" ||
    host === "www.npmjs.com" ||
    host === "crates.io" ||
    host === "pypi.org" ||
    host === "pkg.go.dev" ||
    host === "pub.dev" ||
    host === "hex.pm" ||
    host === "rubygems.org"
  ) {
    return "tool";
  }

  // 5. Well-known documentation sites
  if (
    host === "developer.mozilla.org" ||
    host === "react.dev" ||
    host === "vuejs.org" ||
    host === "angular.io" ||
    host === "nextjs.org" ||
    host === "svelte.dev" ||
    host === "kit.svelte.dev" ||
    host === "www.typescriptlang.org" ||
    host === "typescriptlang.org" ||
    host === "www.rust-lang.org" ||
    host === "doc.rust-lang.org" ||
    host === "docs.python.org" ||
    host === "nodejs.org" ||
    host === "deno.land" ||
    host === "docs.deno.com" ||
    host === "bun.sh" ||
    host === "tailwindcss.com" ||
    host === "www.prisma.io" ||
    host === "supabase.com" ||
    host === "docs.supabase.com" ||
    host === "tanstack.com" ||
    host === "redux.js.org" ||
    host === "jestjs.io" ||
    host === "vitest.dev" ||
    host === "playwright.dev" ||
    host.startsWith("docs.")
  ) {
    return "documentation";
  }

  // 6. VCS platforms — wiki/blob/tree pages are documentation, root paths are repos
  if (host === "github.com" || host === "gitlab.com" || host === "bitbucket.org") {
    if (path.includes("/wiki") || path.includes("/blob/") || path.includes("/tree/")) {
      return "documentation";
    }
    return "repo";
  }

  // 7. Well-known article / blog platforms
  if (
    host === "medium.com" ||
    host.endsWith(".medium.com") ||
    host === "dev.to" ||
    host.endsWith(".hashnode.dev") ||
    host.endsWith(".substack.com") ||
    host === "smashingmagazine.com" ||
    host === "www.smashingmagazine.com" ||
    host === "css-tricks.com" ||
    host === "www.css-tricks.com" ||
    host === "kentcdodds.com" ||
    host === "overreacted.io" ||
    host === "blog.logrocket.com" ||
    host === "www.freecodecamp.org" ||
    host === "freecodecamp.org"
  ) {
    return "article";
  }

  // 8. URL path pattern rules (applied when no domain rule matched)
  if (/\/(docs|documentation|api-reference|reference|manual|handbook)(\/|$)/.test(path)) {
    return "documentation";
  }

  if (/\/wiki\//.test(path)) {
    return "documentation";
  }

  if (/\/(watch|video|videos|playlist)(\/|$)/.test(path)) {
    return "video";
  }

  if (/\/(podcast|podcasts|episode|episodes)(\/|$)/.test(path)) {
    return "podcast";
  }

  if (/\/(course|courses|learn|tutorial|tutorials|curriculum|bootcamp)(\/|$)/.test(path)) {
    return "course";
  }

  if (/\/(blog|post|posts|article|articles|writing)(\/|$)/.test(path)) {
    return "article";
  }

  if (/\/(package|packages|plugin|plugins|extension|extensions)(\/|$)/.test(path)) {
    return "tool";
  }

  // 9. Text keyword fallbacks (title + description)
  if (/\bdocumentation\b/.test(text) || /\bapi reference\b/.test(text) || /\breference guide\b/.test(text)) {
    return "documentation";
  }

  if (/\bvideo\b/.test(text) || /\bwatch now\b/.test(text)) {
    return "video";
  }

  if (/\bpodcast\b/.test(text) || /\bepisode\b/.test(text)) {
    return "podcast";
  }

  if (/\bcourse\b/.test(text) || /\bbootcamp\b/.test(text) || /\bcurriculum\b/.test(text)) {
    return "course";
  }

  if (/\bplayground\b/.test(text) || /\bsandbox\b/.test(text)) {
    return "tool";
  }

  return "article";
}

// ─── Topic-tag inference ──────────────────────────────────────────────────────

type TagRule = { readonly pattern: RegExp; readonly tag: string };

const TAG_RULES: ReadonlyArray<TagRule> = [
  // Languages
  { pattern: /\bjavascript\b/i, tag: "javascript" },
  { pattern: /\btypescript\b/i, tag: "typescript" },
  { pattern: /\bpython\b/i, tag: "python" },
  { pattern: /\brust\b/i, tag: "rust" },
  { pattern: /\bgolang\b|\bgo\s+(?:lang|module|package|tutorial|programming)\b/i, tag: "go" },
  { pattern: /\bjava\b(?!script)/i, tag: "java" },
  { pattern: /\bkotlin\b/i, tag: "kotlin" },
  { pattern: /\bswift\b/i, tag: "swift" },
  { pattern: /\bruby\b/i, tag: "ruby" },
  { pattern: /\bphp\b/i, tag: "php" },
  { pattern: /\belixir\b/i, tag: "elixir" },
  { pattern: /\bdart\b/i, tag: "dart" },

  // Frontend frameworks
  { pattern: /\breact\b/i, tag: "react" },
  { pattern: /\bvue(?:\.?js)?\b/i, tag: "vue" },
  { pattern: /\bangular\b/i, tag: "angular" },
  { pattern: /\bsvelte\b/i, tag: "svelte" },
  { pattern: /\bnext\.?js\b|\bnextjs\b/i, tag: "nextjs" },
  { pattern: /\bnuxt\b/i, tag: "nuxt" },
  { pattern: /\bremix\b/i, tag: "remix" },
  { pattern: /\bastro\b/i, tag: "astro" },
  { pattern: /\bhtmx\b/i, tag: "htmx" },
  { pattern: /\bsolid\.?js\b|\bsolidjs\b/i, tag: "solidjs" },

  // Styling
  { pattern: /\btailwind(?:css)?\b/i, tag: "tailwind" },
  { pattern: /\bcss\b/i, tag: "css" },
  { pattern: /\bsass\b|\bscss\b/i, tag: "sass" },
  { pattern: /\banimation\b/i, tag: "animation" },

  // Backend / runtime
  { pattern: /\bnode\.?js\b|\bnodejs\b/i, tag: "nodejs" },
  { pattern: /\bdeno\b/i, tag: "deno" },
  { pattern: /\bbun\b/i, tag: "bun" },
  { pattern: /\bexpress\b/i, tag: "express" },
  { pattern: /\bfastify\b/i, tag: "fastify" },
  { pattern: /\bnest\.?js\b|\bnestjs\b/i, tag: "nestjs" },
  { pattern: /\bdjango\b/i, tag: "django" },
  { pattern: /\bflask\b/i, tag: "flask" },
  { pattern: /\bfastapi\b/i, tag: "fastapi" },
  { pattern: /\bruby\s+on\s+rails\b|\brails\b/i, tag: "rails" },
  { pattern: /\blaravel\b/i, tag: "laravel" },
  { pattern: /\bspring\s+(?:boot|framework|mvc|security)\b/i, tag: "spring" },

  // Database & data
  { pattern: /\bsql\b/i, tag: "sql" },
  { pattern: /\bpostgresql\b|\bpostgres\b/i, tag: "postgresql" },
  { pattern: /\bmysql\b/i, tag: "mysql" },
  { pattern: /\bsqlite\b/i, tag: "sqlite" },
  { pattern: /\bmongodb\b|\bmongo\b/i, tag: "mongodb" },
  { pattern: /\bredis\b/i, tag: "redis" },
  { pattern: /\bprisma\b/i, tag: "prisma" },
  { pattern: /\bdrizzle\b/i, tag: "drizzle" },
  { pattern: /\bsupabase\b/i, tag: "supabase" },
  { pattern: /\bfirebase\b/i, tag: "firebase" },

  // API / web protocols
  { pattern: /\bapi\b/i, tag: "api" },
  { pattern: /\brest(?:ful)?\b/i, tag: "rest" },
  { pattern: /\bgraphql\b/i, tag: "graphql" },
  { pattern: /\bgrpc\b/i, tag: "grpc" },
  { pattern: /\bwebsocket\b/i, tag: "websocket" },
  { pattern: /\bwebhook\b/i, tag: "webhook" },

  // Auth / security
  { pattern: /\bauth(?:entication|orization)?\b/i, tag: "auth" },
  { pattern: /\boauth\b/i, tag: "oauth" },
  { pattern: /\bjwt\b/i, tag: "jwt" },
  { pattern: /\bsecurity\b/i, tag: "security" },

  // Testing
  { pattern: /\btest(?:ing)?\b/i, tag: "testing" },
  { pattern: /\bjest\b/i, tag: "jest" },
  { pattern: /\bvitest\b/i, tag: "vitest" },
  { pattern: /\bplaywright\b/i, tag: "playwright" },
  { pattern: /\bcypress\b/i, tag: "cypress" },

  // DevOps / infra
  { pattern: /\bdocker\b/i, tag: "docker" },
  { pattern: /\bkubernetes\b|\bk8s\b/i, tag: "kubernetes" },
  { pattern: /\bgit\b/i, tag: "git" },
  { pattern: /\baws\b|\bamazon\s+web\s+services\b/i, tag: "aws" },
  { pattern: /\bvercel\b/i, tag: "vercel" },
  { pattern: /\bcloudflare\b/i, tag: "cloudflare" },
  { pattern: /\bci\/cd\b|\bgithub\s+actions\b|\bgitlab\s+ci\b/i, tag: "ci-cd" },

  // Build tools
  { pattern: /\bvite\b/i, tag: "vite" },
  { pattern: /\bwebpack\b/i, tag: "webpack" },
  { pattern: /\besbuild\b/i, tag: "esbuild" },
  { pattern: /\brollup\b/i, tag: "rollup" },

  // Concepts
  { pattern: /\bperformance\b/i, tag: "performance" },
  { pattern: /\baccessibility\b|\ba11y\b/i, tag: "accessibility" },
  { pattern: /\bseo\b/i, tag: "seo" },
  { pattern: /\bstate\s+management\b/i, tag: "state-management" },
  { pattern: /\bcach(?:ing|e)\b/i, tag: "caching" },
  { pattern: /\bdeployment\b|\bdeploy\b/i, tag: "deployment" },
  { pattern: /\barchitecture\b/i, tag: "architecture" },
  { pattern: /\bdesign\s+patterns?\b/i, tag: "design-patterns" },
  { pattern: /\btype[\s-]?safe(?:ty)?\b/i, tag: "type-safety" },
  { pattern: /\bopen[\s-]?source\b/i, tag: "open-source" },
];

export function inferSuggestedTags(
  hostname: string,
  pathname: string,
  title: string | null,
  description: string | null,
): string[] {
  // Include path tokens (slashes and hyphens → spaces) so /react/hooks or /typescript/
  // path segments contribute to tag matching alongside title and description.
  const pathTokens = pathname.replace(/[-/]/g, " ");
  const haystack = `${hostname} ${pathTokens} ${title ?? ""} ${description ?? ""}`;
  const found = new Set<string>();

  for (const { pattern, tag } of TAG_RULES) {
    if (pattern.test(haystack)) {
      found.add(tag);
    }
  }

  return Array.from(found);
}
