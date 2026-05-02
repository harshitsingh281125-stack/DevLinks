import { describe, expect, it } from "vitest";
import { inferResourceType, inferSuggestedTags } from "./taggingRules";

// ─── inferResourceType ────────────────────────────────────────────────────────

describe("inferResourceType", () => {
  // Domain: video
  describe("video hosting platforms", () => {
    it.each([
      ["youtube.com", "/watch", "How React Works", null],
      ["www.youtube.com", "/watch", "React Tutorial", null],
      ["youtu.be", "/dQw4w9WgXcQ", null, null],
      ["vimeo.com", "/123456", "Design Systems Talk", null],
      ["loom.com", "/share/abc", "Code walkthrough", null],
      ["wistia.com", "/medias/abc", null, null],
    ])('returns "video" for %s%s', (hostname, pathname, title, description) => {
      expect(inferResourceType(hostname, pathname, title, description)).toBe("video");
    });
  });

  // Domain: podcast
  describe("podcast platforms", () => {
    it.each([
      ["podcasts.apple.com", "/us/podcast/syntax/id1313466491", "Syntax Podcast", null],
      ["overcast.fm", "/+abc123", "Episode title", null],
      ["pocketcasts.com", "/podcasts/podcast/abc", null, null],
      ["player.fm", "/series/series-id", "Dev podcast", null],
      ["changelog.com", "/podcast/456", "Go Time", null],
      ["open.spotify.com", "/episode/abc123", "Episode: React Server Components", null],
    ])('returns "podcast" for %s%s', (hostname, pathname, title, description) => {
      expect(inferResourceType(hostname, pathname, title, description)).toBe("podcast");
    });
  });

  // Domain: course platforms
  describe("course platforms", () => {
    it.each([
      ["udemy.com", "/course/react-complete-guide", "The Complete React Guide", null],
      ["www.udemy.com", "/course/typescript", "TypeScript Masterclass", null],
      ["coursera.org", "/learn/machine-learning", "Machine Learning", null],
      ["egghead.io", "/courses/build-react-apps", "Build React Apps", null],
      ["frontendmasters.com", "/courses/react-typescript", "React + TypeScript", null],
      ["pluralsight.com", "/courses/react-fundamentals", null, null],
      ["scrimba.com", "/learn/learnreact", "Learn React", null],
      ["codecademy.com", "/learn/react-101", "React 101", null],
      ["skillshare.com", "/classes/abc/123", null, null],
      ["linkedin.com", "/learning/react-essential-training", "React Essential", null],
    ])('returns "course" for %s%s', (hostname, pathname, title, description) => {
      expect(inferResourceType(hostname, pathname, title, description)).toBe("course");
    });
  });

  // Domain: package registries
  describe("package registries", () => {
    it.each([
      ["npmjs.com", "/package/react", "react", "A JavaScript library for building UIs"],
      ["www.npmjs.com", "/package/typescript", "typescript", null],
      ["crates.io", "/crates/serde", "serde", "Serialization framework"],
      ["pypi.org", "/project/requests", "requests", "HTTP library"],
      ["pkg.go.dev", "/github.com/gin-gonic/gin", "gin", null],
      ["pub.dev", "/packages/flutter", "flutter", null],
      ["rubygems.org", "/gems/rails", "rails", null],
    ])('returns "tool" for %s%s', (hostname, pathname, title, description) => {
      expect(inferResourceType(hostname, pathname, title, description)).toBe("tool");
    });
  });

  // Domain: well-known docs sites
  describe("well-known documentation sites", () => {
    it.each([
      ["developer.mozilla.org", "/en-US/docs/Web/CSS", "CSS: Flexbox", null],
      ["react.dev", "/learn/thinking-in-react", "Thinking in React", null],
      ["vuejs.org", "/guide/introduction", "Introduction to Vue", null],
      ["angular.io", "/guide/architecture", "Angular Architecture", null],
      ["nextjs.org", "/docs/routing", "Routing", null],
      ["svelte.dev", "/docs/introduction", "Svelte docs", null],
      ["kit.svelte.dev", "/docs/routing", "SvelteKit routing", null],
      ["typescriptlang.org", "/docs/handbook/types", "TypeScript Handbook", null],
      ["www.typescriptlang.org", "/tsconfig", "tsconfig reference", null],
      ["www.rust-lang.org", "/learn", "Learn Rust", null],
      ["doc.rust-lang.org", "/std/index.html", "Rust std library", null],
      ["docs.python.org", "/3/library/pathlib", "pathlib docs", null],
      ["nodejs.org", "/en/docs/guides", "Node.js guides", null],
      ["deno.land", "/x/oak", "Oak middleware", null],
      ["tailwindcss.com", "/docs/installation", "Install Tailwind", null],
      ["www.prisma.io", "/docs/getting-started", "Prisma Getting Started", null],
      ["supabase.com", "/docs/reference/javascript", "JS Client", null],
      ["docs.supabase.com", "/storage", "Supabase Storage", null],
      ["tanstack.com", "/query/latest/docs", "TanStack Query docs", null],
      ["redux.js.org", "/tutorials/quick-start", "Redux Quick Start", null],
      ["jestjs.io", "/docs/getting-started", "Getting started", null],
      ["vitest.dev", "/guide", "Vitest guide", null],
      ["playwright.dev", "/docs/intro", "Playwright intro", null],
      ["docs.aws.amazon.com", "/s3/index.html", "S3 docs", null],
    ])('returns "documentation" for %s%s', (hostname, pathname, title, description) => {
      expect(inferResourceType(hostname, pathname, title, description)).toBe("documentation");
    });
  });

  // Domain: GitHub / GitLab
  describe("VCS platforms", () => {
    it("returns 'repo' for a GitHub repo root", () => {
      expect(inferResourceType("github.com", "/facebook/react", "GitHub - facebook/react", null)).toBe("repo");
    });

    it("returns 'repo' for a GitLab project page", () => {
      expect(inferResourceType("gitlab.com", "/user/project", null, null)).toBe("repo");
    });

    it("returns 'documentation' for a GitHub wiki page", () => {
      expect(inferResourceType("github.com", "/user/repo/wiki/Home", null, null)).toBe("documentation");
    });

    it("returns 'documentation' for a GitHub blob page", () => {
      expect(inferResourceType("github.com", "/user/repo/blob/main/README.md", null, null)).toBe("documentation");
    });

    it("returns 'documentation' for a GitHub tree path", () => {
      expect(inferResourceType("github.com", "/user/repo/tree/main/docs", null, null)).toBe("documentation");
    });
  });

  // Domain: article/blog platforms
  describe("article and blog platforms", () => {
    it.each([
      ["medium.com", "/@user/my-post-abc123", "My post", null],
      ["userinput.medium.com", "/post-slug-abc", "Exploring React", null],
      ["dev.to", "/user/article-slug", "Article title", null],
      ["user.hashnode.dev", "/my-post", "Post title", null],
      ["myblog.substack.com", "/p/my-post", null, null],
      ["smashingmagazine.com", "/2024/01/article", "Smashing Article", null],
      ["css-tricks.com", "/snippets/css/flexbox", "Flexbox guide", null],
      ["kentcdodds.com", "/blog/react-patterns", "React patterns", null],
      ["overreacted.io", "/why-do-hooks-rely-on-call-order", "Why hooks", null],
      ["blog.logrocket.com", "/react-hooks-cheat-sheet", "Hooks cheat sheet", null],
      ["freecodecamp.org", "/news/react-useEffect", "useEffect guide", null],
    ])('returns "article" for %s%s', (hostname, pathname, title, description) => {
      expect(inferResourceType(hostname, pathname, title, description)).toBe("article");
    });
  });

  // URL path rules
  describe("URL path pattern rules", () => {
    it.each([
      ["/docs/getting-started", "documentation"],
      ["/docs/", "documentation"],
      ["/documentation/intro", "documentation"],
      ["/api-reference/endpoints", "documentation"],
      ["/reference/hooks", "documentation"],
      ["/manual/pages", "documentation"],
      ["/handbook/types", "documentation"],
      ["/wiki/Home", "documentation"],
      ["/wiki/architecture", "documentation"],
    ])("returns %j → %s via path", (pathname, expected) => {
      expect(inferResourceType("example.com", pathname, null, null)).toBe(expected);
    });

    it.each([
      ["/watch", "video"],
      ["/video/123", "video"],
      ["/videos/tutorials", "video"],
      ["/playlist/abc", "video"],
    ])("returns %j → %s via path", (pathname, expected) => {
      expect(inferResourceType("example.com", pathname, null, null)).toBe(expected);
    });

    it.each([
      ["/podcast/episode-1", "podcast"],
      ["/podcasts/", "podcast"],
      ["/episode/42", "podcast"],
      ["/episodes/archive", "podcast"],
    ])("returns %j → %s via path", (pathname, expected) => {
      expect(inferResourceType("example.com", pathname, null, null)).toBe(expected);
    });

    it.each([
      ["/course/react", "course"],
      ["/courses/", "course"],
      ["/learn/typescript", "course"],
      ["/tutorial/css-grid", "course"],
      ["/tutorials/", "course"],
      ["/curriculum/web-dev", "course"],
      ["/bootcamp/js", "course"],
    ])("returns %j → %s via path", (pathname, expected) => {
      expect(inferResourceType("example.com", pathname, null, null)).toBe(expected);
    });

    it.each([
      ["/blog/my-post", "article"],
      ["/post/123", "article"],
      ["/posts/recent", "article"],
      ["/article/intro", "article"],
      ["/articles/", "article"],
      ["/writing/essays", "article"],
    ])("returns %j → %s via path", (pathname, expected) => {
      expect(inferResourceType("example.com", pathname, null, null)).toBe(expected);
    });

    it.each([
      ["/package/express", "tool"],
      ["/packages/", "tool"],
      ["/plugin/vite-plugin-foo", "tool"],
      ["/plugins/", "tool"],
      ["/extension/chrome-ext", "tool"],
    ])("returns %j → %s via path", (pathname, expected) => {
      expect(inferResourceType("example.com", pathname, null, null)).toBe(expected);
    });
  });

  // Text keyword fallbacks
  describe("text keyword fallbacks", () => {
    it('returns "documentation" when title contains "documentation"', () => {
      expect(inferResourceType("example.com", "/", "Complete Documentation", null)).toBe("documentation");
    });

    it('returns "documentation" when description contains "api reference"', () => {
      expect(inferResourceType("example.com", "/", null, "The official api reference for this library")).toBe("documentation");
    });

    it('returns "documentation" when description contains "reference guide"', () => {
      expect(inferResourceType("example.com", "/", null, "A comprehensive reference guide")).toBe("documentation");
    });

    it('returns "video" when title contains "video"', () => {
      expect(inferResourceType("example.com", "/", "Watch this video to learn React", null)).toBe("video");
    });

    it('returns "podcast" when title contains "podcast"', () => {
      expect(inferResourceType("example.com", "/", "The JavaScript Podcast", null)).toBe("podcast");
    });

    it('returns "podcast" when description contains "episode"', () => {
      expect(inferResourceType("example.com", "/", "Show notes", "In this episode we discuss TypeScript")).toBe("podcast");
    });

    it('returns "course" when title contains "course"', () => {
      expect(inferResourceType("example.com", "/", "Full-Stack Developer Course", null)).toBe("course");
    });

    it('returns "course" when description contains "bootcamp"', () => {
      expect(inferResourceType("example.com", "/", null, "Join our intensive bootcamp to learn web dev")).toBe("course");
    });

    it('returns "tool" when title contains "playground"', () => {
      expect(inferResourceType("example.com", "/", "TypeScript Playground", null)).toBe("tool");
    });

    it('returns "tool" when title contains "sandbox"', () => {
      expect(inferResourceType("example.com", "/", "React Sandbox", null)).toBe("tool");
    });

    it('defaults to "article" when nothing matches', () => {
      expect(inferResourceType("example.com", "/", "Some Random Page", "No specific type signals here")).toBe("article");
    });
  });

  // Priority: domain beats path
  describe("priority ordering", () => {
    it("domain rule wins over path rule (youtube.com with /docs path)", () => {
      expect(inferResourceType("youtube.com", "/docs", null, null)).toBe("video");
    });

    it("domain rule wins over text keyword (github.com repo with 'documentation' in title)", () => {
      expect(inferResourceType("github.com", "/user/repo", "Complete Documentation for my library", null)).toBe("repo");
    });

    it("github.com wiki path produces documentation over default repo", () => {
      expect(inferResourceType("github.com", "/user/repo/wiki/Setup", null, null)).toBe("documentation");
    });
  });
});

// ─── inferSuggestedTags ───────────────────────────────────────────────────────

describe("inferSuggestedTags", () => {
  // Language tags from title
  describe("language detection", () => {
    it("detects javascript from title", () => {
      expect(inferSuggestedTags("example.com", "/", "JavaScript Patterns", null)).toContain("javascript");
    });

    it("detects typescript from title", () => {
      expect(inferSuggestedTags("example.com", "/", "TypeScript Deep Dive", null)).toContain("typescript");
    });

    it("detects python from description", () => {
      expect(inferSuggestedTags("example.com", "/", null, "A guide to Python async programming")).toContain("python");
    });

    it("detects rust from title", () => {
      expect(inferSuggestedTags("example.com", "/", "The Rust Programming Language", null)).toContain("rust");
    });

    it("detects go via 'golang' keyword", () => {
      expect(inferSuggestedTags("example.com", "/", "Golang tutorial for beginners", null)).toContain("go");
    });

    it("detects go via 'go module' phrase", () => {
      expect(inferSuggestedTags("example.com", "/", "How to publish a go module", null)).toContain("go");
    });

    it("detects java without matching javascript", () => {
      const tags = inferSuggestedTags("example.com", "/", "Java Spring Boot tutorial", null);
      expect(tags).toContain("java");
      expect(tags).not.toContain("javascript");
    });

    it("detects kotlin from title", () => {
      expect(inferSuggestedTags("example.com", "/", "Kotlin coroutines guide", null)).toContain("kotlin");
    });

    it("detects ruby from title", () => {
      expect(inferSuggestedTags("example.com", "/", "Ruby on Rails quickstart", null)).toContain("ruby");
    });

    it("detects php from title", () => {
      expect(inferSuggestedTags("example.com", "/", "PHP 8 new features", null)).toContain("php");
    });
  });

  // Framework tags
  describe("framework detection", () => {
    it("detects react from title", () => {
      expect(inferSuggestedTags("example.com", "/", "React hooks guide", null)).toContain("react");
    });

    it("detects vue from title 'Vue.js'", () => {
      expect(inferSuggestedTags("example.com", "/", "Vue.js component patterns", null)).toContain("vue");
    });

    it("detects vue from plain 'Vue'", () => {
      expect(inferSuggestedTags("example.com", "/", "Building with Vue", null)).toContain("vue");
    });

    it("detects angular from title", () => {
      expect(inferSuggestedTags("example.com", "/", "Angular dependency injection", null)).toContain("angular");
    });

    it("detects svelte from description", () => {
      expect(inferSuggestedTags("example.com", "/", null, "Svelte makes building UIs simple")).toContain("svelte");
    });

    it("detects nextjs from 'Next.js' title", () => {
      expect(inferSuggestedTags("example.com", "/", "Next.js 14 app router", null)).toContain("nextjs");
    });

    it("detects nextjs from 'nextjs' title", () => {
      expect(inferSuggestedTags("example.com", "/", "Nextjs caching strategies", null)).toContain("nextjs");
    });

    it("detects remix from title", () => {
      expect(inferSuggestedTags("example.com", "/", "Full Stack with Remix", null)).toContain("remix");
    });

    it("detects htmx from title", () => {
      expect(inferSuggestedTags("example.com", "/", "HTMX: The missing guide", null)).toContain("htmx");
    });

    it("detects astro from description", () => {
      expect(inferSuggestedTags("example.com", "/", null, "Astro is a web framework for content-rich sites")).toContain("astro");
    });
  });

  // Styling tags
  describe("styling detection", () => {
    it("detects tailwind from title", () => {
      expect(inferSuggestedTags("example.com", "/", "Mastering Tailwind CSS", null)).toContain("tailwind");
    });

    it("detects css from title", () => {
      expect(inferSuggestedTags("example.com", "/", "CSS Grid Layout Guide", null)).toContain("css");
    });

    it("detects sass from title", () => {
      expect(inferSuggestedTags("example.com", "/", "SASS vs SCSS: what to use", null)).toContain("sass");
    });

    it("detects scss as sass tag", () => {
      expect(inferSuggestedTags("example.com", "/", "Writing SCSS modules", null)).toContain("sass");
    });
  });

  // Backend / runtime tags
  describe("backend / runtime detection", () => {
    it("detects nodejs from 'Node.js' title", () => {
      expect(inferSuggestedTags("example.com", "/", "Node.js streams explained", null)).toContain("nodejs");
    });

    it("detects nodejs from 'nodejs' title", () => {
      expect(inferSuggestedTags("example.com", "/", "Nodejs event loop deep dive", null)).toContain("nodejs");
    });

    it("detects deno from description", () => {
      expect(inferSuggestedTags("example.com", "/", null, "Getting started with Deno runtime")).toContain("deno");
    });

    it("detects express from title", () => {
      expect(inferSuggestedTags("example.com", "/", "Building REST APIs with Express", null)).toContain("express");
    });

    it("detects fastify from title", () => {
      expect(inferSuggestedTags("example.com", "/", "Fastify vs Express benchmarks", null)).toContain("fastify");
    });

    it("detects nestjs from 'NestJS' title", () => {
      expect(inferSuggestedTags("example.com", "/", "NestJS microservices guide", null)).toContain("nestjs");
    });

    it("detects django from title", () => {
      expect(inferSuggestedTags("example.com", "/", "Django REST framework tutorial", null)).toContain("django");
    });

    it("detects fastapi from title", () => {
      expect(inferSuggestedTags("example.com", "/", "FastAPI async endpoints", null)).toContain("fastapi");
    });
  });

  // Database tags
  describe("database detection", () => {
    it("detects sql from title", () => {
      expect(inferSuggestedTags("example.com", "/", "SQL query optimization", null)).toContain("sql");
    });

    it("detects postgresql from 'postgres' title", () => {
      expect(inferSuggestedTags("example.com", "/", "Postgres full-text search", null)).toContain("postgresql");
    });

    it("detects postgresql from 'postgresql' title", () => {
      expect(inferSuggestedTags("example.com", "/", "PostgreSQL jsonb column guide", null)).toContain("postgresql");
    });

    it("detects mongodb from title", () => {
      expect(inferSuggestedTags("example.com", "/", "MongoDB aggregation pipeline", null)).toContain("mongodb");
    });

    it("detects redis from description", () => {
      expect(inferSuggestedTags("example.com", "/", null, "Redis pub/sub and streams")).toContain("redis");
    });

    it("detects prisma from title", () => {
      expect(inferSuggestedTags("example.com", "/", "Prisma ORM migrations guide", null)).toContain("prisma");
    });

    it("detects supabase from title", () => {
      expect(inferSuggestedTags("example.com", "/", "Supabase row level security", null)).toContain("supabase");
    });

    it("detects firebase from title", () => {
      expect(inferSuggestedTags("example.com", "/", "Firebase Firestore tutorial", null)).toContain("firebase");
    });
  });

  // API / protocol tags
  describe("API and protocol detection", () => {
    it("detects api from title", () => {
      expect(inferSuggestedTags("example.com", "/", "Building a public API", null)).toContain("api");
    });

    it("detects graphql from title", () => {
      expect(inferSuggestedTags("example.com", "/", "GraphQL subscriptions with Apollo", null)).toContain("graphql");
    });

    it("detects websocket from title", () => {
      expect(inferSuggestedTags("example.com", "/", "WebSocket real-time chat app", null)).toContain("websocket");
    });

    it("detects webhook from description", () => {
      expect(inferSuggestedTags("example.com", "/", null, "Set up a webhook endpoint to receive events")).toContain("webhook");
    });
  });

  // Auth / security tags
  describe("auth and security detection", () => {
    it("detects auth from 'authentication' title", () => {
      expect(inferSuggestedTags("example.com", "/", "Authentication with Passport.js", null)).toContain("auth");
    });

    it("detects auth from 'auth' title", () => {
      expect(inferSuggestedTags("example.com", "/", "Auth flow in Next.js", null)).toContain("auth");
    });

    it("detects oauth from title", () => {
      expect(inferSuggestedTags("example.com", "/", "OAuth 2.0 explained", null)).toContain("oauth");
    });

    it("detects jwt from title", () => {
      expect(inferSuggestedTags("example.com", "/", "JWT token refresh strategy", null)).toContain("jwt");
    });

    it("detects security from title", () => {
      expect(inferSuggestedTags("example.com", "/", "Web Security best practices", null)).toContain("security");
    });
  });

  // Testing tags
  describe("testing detection", () => {
    it("detects testing from 'testing' title", () => {
      expect(inferSuggestedTags("example.com", "/", "React Testing Library guide", null)).toContain("testing");
    });

    it("detects testing from 'test' title", () => {
      expect(inferSuggestedTags("example.com", "/", "How to test React hooks", null)).toContain("testing");
    });

    it("detects jest from title", () => {
      expect(inferSuggestedTags("example.com", "/", "Jest snapshot testing", null)).toContain("jest");
    });

    it("detects vitest from title", () => {
      expect(inferSuggestedTags("example.com", "/", "Vitest vs Jest: a comparison", null)).toContain("vitest");
    });

    it("detects playwright from title", () => {
      expect(inferSuggestedTags("example.com", "/", "Playwright e2e testing tutorial", null)).toContain("playwright");
    });

    it("detects cypress from description", () => {
      expect(inferSuggestedTags("example.com", "/", null, "Write Cypress component tests")).toContain("cypress");
    });
  });

  // DevOps / infra tags
  describe("devops and infra detection", () => {
    it("detects docker from title", () => {
      expect(inferSuggestedTags("example.com", "/", "Docker multi-stage builds", null)).toContain("docker");
    });

    it("detects kubernetes from title", () => {
      expect(inferSuggestedTags("example.com", "/", "Kubernetes deployment strategies", null)).toContain("kubernetes");
    });

    it("detects kubernetes from 'k8s'", () => {
      expect(inferSuggestedTags("example.com", "/", "k8s ingress controllers", null)).toContain("kubernetes");
    });

    it("detects git from title", () => {
      expect(inferSuggestedTags("example.com", "/", "Git branching strategies", null)).toContain("git");
    });

    it("detects aws from title", () => {
      expect(inferSuggestedTags("example.com", "/", "AWS Lambda cold starts", null)).toContain("aws");
    });

    it("detects vercel from title", () => {
      expect(inferSuggestedTags("example.com", "/", "Deploying to Vercel with CI", null)).toContain("vercel");
    });

    it("detects cloudflare from title", () => {
      expect(inferSuggestedTags("example.com", "/", "Cloudflare Workers guide", null)).toContain("cloudflare");
    });

    it("detects ci-cd from 'GitHub Actions' title", () => {
      expect(inferSuggestedTags("example.com", "/", "GitHub Actions for Node.js projects", null)).toContain("ci-cd");
    });
  });

  // Build tool tags
  describe("build tool detection", () => {
    it("detects vite from title", () => {
      expect(inferSuggestedTags("example.com", "/", "Vite plugin development guide", null)).toContain("vite");
    });

    it("detects webpack from title", () => {
      expect(inferSuggestedTags("example.com", "/", "Webpack code splitting tutorial", null)).toContain("webpack");
    });

    it("detects esbuild from title", () => {
      expect(inferSuggestedTags("example.com", "/", "esbuild: An Extremely Fast Bundler", null)).toContain("esbuild");
    });
  });

  // Concept tags
  describe("concept detection", () => {
    it("detects performance from title", () => {
      expect(inferSuggestedTags("example.com", "/", "React performance optimizations", null)).toContain("performance");
    });

    it("detects accessibility from title", () => {
      expect(inferSuggestedTags("example.com", "/", "Web accessibility best practices", null)).toContain("accessibility");
    });

    it("detects accessibility from 'a11y'", () => {
      expect(inferSuggestedTags("example.com", "/", "a11y in React forms", null)).toContain("accessibility");
    });

    it("detects seo from title", () => {
      expect(inferSuggestedTags("example.com", "/", "SEO for Next.js apps", null)).toContain("seo");
    });

    it("detects state-management from title", () => {
      expect(inferSuggestedTags("example.com", "/", "React state management with Zustand", null)).toContain("state-management");
    });

    it("detects caching from title", () => {
      expect(inferSuggestedTags("example.com", "/", "HTTP caching strategies explained", null)).toContain("caching");
    });

    it("detects deployment from title", () => {
      expect(inferSuggestedTags("example.com", "/", "Zero-downtime deployment patterns", null)).toContain("deployment");
    });

    it("detects architecture from title", () => {
      expect(inferSuggestedTags("example.com", "/", "Clean architecture in Node.js", null)).toContain("architecture");
    });

    it("detects open-source from title", () => {
      expect(inferSuggestedTags("example.com", "/", "Contributing to open source projects", null)).toContain("open-source");
    });
  });

  // URL path contributes to tag matching
  describe("pathname-based tag detection", () => {
    it("picks up 'react' from the URL path segment", () => {
      expect(inferSuggestedTags("example.com", "/blog/react/hooks-guide", null, null)).toContain("react");
    });

    it("picks up 'typescript' from the URL path segment", () => {
      expect(inferSuggestedTags("example.com", "/docs/typescript/getting-started", null, null)).toContain("typescript");
    });

    it("picks up 'css' from the URL path segment", () => {
      expect(inferSuggestedTags("developer.mozilla.org", "/en-US/docs/Web/CSS/grid", null, null)).toContain("css");
    });

    it("picks up package name from npmjs path", () => {
      const tags = inferSuggestedTags("npmjs.com", "/package/express", "express", "Fast, minimalist web framework");
      expect(tags).toContain("express");
    });
  });

  // Hostname contributes to tag matching
  describe("hostname-based tag detection", () => {
    it("picks up 'supabase' from supabase.com hostname", () => {
      expect(inferSuggestedTags("supabase.com", "/docs/auth", null, null)).toContain("supabase");
    });

    it("picks up 'tailwind' from tailwindcss.com hostname", () => {
      expect(inferSuggestedTags("tailwindcss.com", "/docs/installation", null, null)).toContain("tailwind");
    });

    it("picks up 'prisma' from prisma.io hostname", () => {
      expect(inferSuggestedTags("www.prisma.io", "/docs/orm", null, null)).toContain("prisma");
    });
  });

  // Returns a deduplicated array
  describe("deduplication", () => {
    it("does not return duplicate tags when the same keyword appears multiple times", () => {
      const tags = inferSuggestedTags(
        "example.com",
        "/react/tutorial",
        "React tutorial for React developers",
        "Learn React today",
      );
      const reactCount = tags.filter((t) => t === "react").length;
      expect(reactCount).toBe(1);
    });

    it("merges 'postgres' and 'postgresql' into a single tag", () => {
      const tags = inferSuggestedTags(
        "example.com",
        "/",
        "PostgreSQL vs postgres: what's the difference?",
        null,
      );
      const pgCount = tags.filter((t) => t === "postgresql").length;
      expect(pgCount).toBe(1);
    });
  });

  // No false positives for common ambiguous words
  describe("no false positives", () => {
    it("does not tag 'javascript' from 'java' standalone", () => {
      const tags = inferSuggestedTags("example.com", "/", "Java Spring Boot tutorial", null);
      expect(tags).not.toContain("javascript");
    });

    it("does not tag 'java' from 'javascript' text", () => {
      const tags = inferSuggestedTags("example.com", "/", "JavaScript closures explained", null);
      expect(tags).not.toContain("java");
    });

    it("returns an empty array when nothing matches", () => {
      const tags = inferSuggestedTags("example.com", "/", "Generic blog post about cooking", null);
      expect(tags).toHaveLength(0);
    });
  });

  // Multiple tags returned together
  describe("multiple tags in one shot", () => {
    it("returns multiple matching tags for a React+TypeScript article", () => {
      const tags = inferSuggestedTags(
        "medium.com",
        "/@user/react-typescript-hooks",
        "React Hooks with TypeScript: A Complete Guide",
        "Learn how to type your React hooks using TypeScript for type safety.",
      );
      expect(tags).toContain("react");
      expect(tags).toContain("typescript");
      expect(tags).toContain("type-safety");
    });

    it("returns multiple tags for a full-stack Next.js + Supabase post", () => {
      const tags = inferSuggestedTags(
        "dev.to",
        "/user/nextjs-supabase-auth",
        "Authentication with Next.js and Supabase",
        "Step-by-step guide to OAuth and JWT sessions using Supabase Auth.",
      );
      expect(tags).toContain("nextjs");
      expect(tags).toContain("supabase");
      expect(tags).toContain("auth");
      expect(tags).toContain("oauth");
      expect(tags).toContain("jwt");
    });
  });

  // ── Additional language tags not yet covered ──────────────────────────────
  describe("additional language detection", () => {
    it("detects swift from title", () => {
      expect(inferSuggestedTags("example.com", "/", "Swift concurrency with async/await", null)).toContain("swift");
    });

    it("detects elixir from title", () => {
      expect(inferSuggestedTags("example.com", "/", "Elixir Phoenix LiveView guide", null)).toContain("elixir");
    });

    it("detects dart from description", () => {
      expect(inferSuggestedTags("example.com", "/", null, "Dart is the language behind Flutter")).toContain("dart");
    });
  });

  // ── Additional framework tags ─────────────────────────────────────────────
  describe("additional framework detection", () => {
    it("detects nuxt from title 'Nuxt.js'", () => {
      expect(inferSuggestedTags("example.com", "/", "Nuxt.js server-side rendering", null)).toContain("nuxt");
    });

    it("detects nuxt from plain 'Nuxt'", () => {
      expect(inferSuggestedTags("example.com", "/", "Migrating from Nuxt 2 to Nuxt 3", null)).toContain("nuxt");
    });

    it("detects solidjs from 'SolidJS' title", () => {
      expect(inferSuggestedTags("example.com", "/", "SolidJS reactivity explained", null)).toContain("solidjs");
    });

    it("detects solidjs from 'solid.js' title", () => {
      expect(inferSuggestedTags("example.com", "/", "Why I switched to solid.js", null)).toContain("solidjs");
    });
  });

  // ── Additional styling tags ───────────────────────────────────────────────
  describe("additional styling detection", () => {
    it("detects animation from title", () => {
      expect(inferSuggestedTags("example.com", "/", "CSS animation performance tips", null)).toContain("animation");
    });

    it("detects animation from description", () => {
      expect(inferSuggestedTags("example.com", "/", null, "Learn to create smooth animation with Framer Motion")).toContain("animation");
    });
  });

  // ── Additional backend / runtime tags ────────────────────────────────────
  describe("additional backend and runtime detection", () => {
    it("detects bun from title", () => {
      expect(inferSuggestedTags("example.com", "/", "Bun vs Node.js performance benchmark", null)).toContain("bun");
    });

    it("detects flask from title", () => {
      expect(inferSuggestedTags("example.com", "/", "Flask REST API with SQLAlchemy", null)).toContain("flask");
    });

    it("detects rails from 'Rails' title", () => {
      expect(inferSuggestedTags("example.com", "/", "Rails 7 hotwire introduction", null)).toContain("rails");
    });

    it("detects rails from 'Ruby on Rails' title", () => {
      expect(inferSuggestedTags("example.com", "/", "Ruby on Rails authentication with Devise", null)).toContain("rails");
    });

    it("detects laravel from title", () => {
      expect(inferSuggestedTags("example.com", "/", "Laravel Eloquent ORM relationships", null)).toContain("laravel");
    });

    it("detects spring from 'Spring Boot' title", () => {
      expect(inferSuggestedTags("example.com", "/", "Spring Boot microservices with Docker", null)).toContain("spring");
    });

    it("detects spring from 'Spring Security' title", () => {
      expect(inferSuggestedTags("example.com", "/", "Spring Security OAuth2 configuration", null)).toContain("spring");
    });
  });

  // ── Additional database tags ──────────────────────────────────────────────
  describe("additional database detection", () => {
    it("detects mysql from title", () => {
      expect(inferSuggestedTags("example.com", "/", "MySQL vs PostgreSQL: when to choose what", null)).toContain("mysql");
    });

    it("detects sqlite from title", () => {
      expect(inferSuggestedTags("example.com", "/", "SQLite for local-first apps", null)).toContain("sqlite");
    });

    it("detects drizzle from title", () => {
      expect(inferSuggestedTags("example.com", "/", "Drizzle ORM vs Prisma comparison", null)).toContain("drizzle");
    });

    it("detects mongodb via 'mongo' shorthand in description", () => {
      expect(inferSuggestedTags("example.com", "/", null, "Connecting to a mongo database in Node.js")).toContain("mongodb");
    });
  });

  // ── Additional API / protocol tags ───────────────────────────────────────
  describe("additional API and protocol detection", () => {
    it("detects rest from 'RESTful' title", () => {
      expect(inferSuggestedTags("example.com", "/", "Designing RESTful APIs with Express", null)).toContain("rest");
    });

    it("detects rest from 'REST' title", () => {
      expect(inferSuggestedTags("example.com", "/", "REST vs GraphQL comparison", null)).toContain("rest");
    });

    it("detects grpc from title", () => {
      expect(inferSuggestedTags("example.com", "/", "gRPC streaming with Protocol Buffers", null)).toContain("grpc");
    });
  });

  // ── Additional concept tags ───────────────────────────────────────────────
  describe("additional concept detection", () => {
    it("detects design-patterns from 'design pattern' in title", () => {
      expect(inferSuggestedTags("example.com", "/", "JavaScript design pattern: the observer", null)).toContain("design-patterns");
    });

    it("detects design-patterns from 'design patterns' (plural) in description", () => {
      expect(inferSuggestedTags("example.com", "/", null, "Common design patterns used in enterprise software")).toContain("design-patterns");
    });
  });

  // ── Additional build tool tags ────────────────────────────────────────────
  describe("additional build tool detection", () => {
    it("detects rollup from title", () => {
      expect(inferSuggestedTags("example.com", "/", "Rollup tree-shaking explained", null)).toContain("rollup");
    });
  });

  // ── AWS alias ─────────────────────────────────────────────────────────────
  describe("aws alias detection", () => {
    it("detects aws from 'amazon web services' title", () => {
      expect(inferSuggestedTags("example.com", "/", "Amazon Web Services pricing guide", null)).toContain("aws");
    });
  });

  // ── CI-CD aliases ─────────────────────────────────────────────────────────
  describe("ci-cd alias detection", () => {
    it("detects ci-cd from 'GitLab CI' title", () => {
      expect(inferSuggestedTags("example.com", "/", "GitLab CI pipelines for Docker", null)).toContain("ci-cd");
    });

    it("detects ci-cd from 'ci/cd' title", () => {
      expect(inferSuggestedTags("example.com", "/", "Best practices for ci/cd in monorepos", null)).toContain("ci-cd");
    });
  });
});

// ─── inferResourceType — additional domain coverage ───────────────────────────

describe("inferResourceType - additional domain coverage", () => {
  describe("additional video platform variants", () => {
    it("returns 'video' for fast.wistia.com", () => {
      expect(inferResourceType("fast.wistia.com", "/medias/abc123", null, null)).toBe("video");
    });

    it("returns 'video' for www.vimeo.com", () => {
      expect(inferResourceType("www.vimeo.com", "/123456", "Design talk", null)).toBe("video");
    });

    it("returns 'video' for www.loom.com", () => {
      expect(inferResourceType("www.loom.com", "/share/xyz", "Code walkthrough", null)).toBe("video");
    });
  });

  describe("additional documentation domain variants", () => {
    it("returns 'documentation' for bun.sh", () => {
      expect(inferResourceType("bun.sh", "/docs/installation", "Bun install", null)).toBe("documentation");
    });

    it("returns 'documentation' for docs.stripe.com (docs.* pattern)", () => {
      expect(inferResourceType("docs.stripe.com", "/api", "Stripe API reference", null)).toBe("documentation");
    });

    it("returns 'documentation' for docs.github.com (docs.* pattern)", () => {
      expect(inferResourceType("docs.github.com", "/en/actions", "GitHub Actions docs", null)).toBe("documentation");
    });

    it("returns 'documentation' for docs.netlify.com (docs.* pattern)", () => {
      expect(inferResourceType("docs.netlify.com", "/configure-builds/", null, null)).toBe("documentation");
    });

    it("returns 'documentation' for docs.deno.com", () => {
      expect(inferResourceType("docs.deno.com", "/runtime/manual", "Deno manual", null)).toBe("documentation");
    });
  });

  describe("additional package registry variants", () => {
    it("returns 'tool' for hex.pm (Elixir registry)", () => {
      expect(inferResourceType("hex.pm", "/packages/phoenix", "phoenix", null)).toBe("tool");
    });
  });

  describe("additional course platform variants", () => {
    it("returns 'course' for www.coursera.org", () => {
      expect(inferResourceType("www.coursera.org", "/learn/ml-foundations", "ML Foundations", null)).toBe("course");
    });

    it("returns 'course' for www.codecademy.com", () => {
      expect(inferResourceType("www.codecademy.com", "/learn/python", "Learn Python", null)).toBe("course");
    });
  });

  describe("additional article platform variants", () => {
    it("returns 'article' for www.smashingmagazine.com", () => {
      expect(inferResourceType("www.smashingmagazine.com", "/2024/css-grid", "CSS Grid", null)).toBe("article");
    });

    it("returns 'article' for www.css-tricks.com", () => {
      expect(inferResourceType("www.css-tricks.com", "/flexbox-guide", "Flexbox Guide", null)).toBe("article");
    });

    it("returns 'article' for www.freecodecamp.org", () => {
      expect(inferResourceType("www.freecodecamp.org", "/news/react-hooks", "React hooks", null)).toBe("article");
    });
  });

  describe("Bitbucket VCS paths", () => {
    it("returns 'repo' for a bitbucket.org project root", () => {
      expect(inferResourceType("bitbucket.org", "/user/project", null, null)).toBe("repo");
    });

    it("returns 'documentation' for a bitbucket.org blob path", () => {
      expect(inferResourceType("bitbucket.org", "/user/repo/blob/main/README.md", null, null)).toBe("documentation");
    });

    it("returns 'documentation' for a bitbucket.org wiki path", () => {
      expect(inferResourceType("bitbucket.org", "/user/repo/wiki/Home", null, null)).toBe("documentation");
    });
  });

  describe("GitHub non-wiki/blob/tree paths stay as repo", () => {
    it("returns 'repo' for a GitHub issues page", () => {
      expect(inferResourceType("github.com", "/user/repo/issues/42", null, null)).toBe("repo");
    });

    it("returns 'repo' for a GitHub pull request page", () => {
      expect(inferResourceType("github.com", "/user/repo/pull/7", null, null)).toBe("repo");
    });

    it("returns 'repo' for a GitHub actions page", () => {
      expect(inferResourceType("github.com", "/user/repo/actions", null, null)).toBe("repo");
    });
  });

  describe("additional path pattern variants", () => {
    it("returns 'tool' for /extensions/ path", () => {
      expect(inferResourceType("marketplace.example.com", "/extensions/my-ext", null, null)).toBe("tool");
    });
  });

  describe("additional text keyword fallbacks", () => {
    it("returns 'video' when description contains 'watch now'", () => {
      expect(inferResourceType("example.com", "/", null, "Watch now to learn Docker from scratch")).toBe("video");
    });

    it("returns 'course' when title contains 'curriculum'", () => {
      expect(inferResourceType("example.com", "/", "Full-stack curriculum for beginners", null)).toBe("course");
    });
  });
});
