import { describe, expect, it } from "vitest";
import type { Bookmark } from "@/lib/types";
import {
  buildSearchText,
  matchesSearchQuery,
  normalizeSearchQuery,
  tokenizeQuery,
} from "./searchUtils";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const makeBookmark = (overrides: Partial<Bookmark> = {}): Bookmark => ({
  id: "bm-1",
  userId: "user-1",
  collectionId: "col-1",
  title: "React Hooks Guide",
  url: "https://react.dev/reference/react/hooks",
  normalizedUrl: "react.dev/reference/react/hooks",
  description: "Official guide to React hooks including useState and useEffect",
  domain: "react.dev",
  faviconUrl: null,
  imageUrl: null,
  resourceType: "documentation",
  tags: ["react", "javascript", "hooks"],
  searchText: "react hooks guide react.dev/reference/react/hooks official guide react hooks usestate useeffect react.dev react javascript hooks",
  createdAt: "2026-04-19T00:00:00Z",
  updatedAt: "2026-04-19T00:00:00Z",
  ...overrides,
});

// ─── buildSearchText ──────────────────────────────────────────────────────────

describe("buildSearchText", () => {
  it("joins all fields with spaces, lowercased", () => {
    const result = buildSearchText({
      title: "React Hooks",
      url: "https://react.dev/hooks",
      normalizedUrl: "react.dev/hooks",
      description: "Learn hooks",
      domain: "react.dev",
      tags: ["react", "javascript"],
    });
    expect(result).toBe("react hooks https://react.dev/hooks react.dev/hooks learn hooks react.dev react javascript");
  });

  it("excludes null description from the output", () => {
    const result = buildSearchText({
      title: "Title",
      url: "https://example.com",
      normalizedUrl: "example.com",
      description: null,
      domain: "example.com",
      tags: [],
    });
    expect(result).not.toContain("null");
    expect(result).toBe("title https://example.com example.com example.com");
  });

  it("excludes null domain from the output", () => {
    const result = buildSearchText({
      title: "Title",
      url: "https://example.com",
      normalizedUrl: "example.com",
      description: "A description",
      domain: null,
      tags: [],
    });
    expect(result).not.toContain("null");
  });

  it("includes all tags in order", () => {
    const result = buildSearchText({
      title: "A",
      url: "https://x.com",
      normalizedUrl: "x.com",
      description: null,
      domain: "x.com",
      tags: ["css", "layout", "grid"],
    });
    expect(result).toContain("css layout grid");
  });

  it("lowercases the entire result", () => {
    const result = buildSearchText({
      title: "TypeScript Generics",
      url: "https://TypeScript.org/DOCS",
      normalizedUrl: "TypeScript.org/docs",
      description: "Deep dive into GENERICS",
      domain: "TypeScript.org",
      tags: ["TypeScript"],
    });
    expect(result).toBe(result.toLowerCase());
  });

  it("returns empty string when all fields are empty/null", () => {
    const result = buildSearchText({
      title: "",
      url: "",
      normalizedUrl: "",
      description: null,
      domain: null,
      tags: [],
    });
    expect(result).toBe("");
  });

  it("handles an empty tags array gracefully", () => {
    const result = buildSearchText({
      title: "Vitest",
      url: "https://vitest.dev",
      normalizedUrl: "vitest.dev",
      description: null,
      domain: "vitest.dev",
      tags: [],
    });
    expect(result).toBe("vitest https://vitest.dev vitest.dev vitest.dev");
  });

  it("does not include separator artifacts for missing optional fields", () => {
    const result = buildSearchText({
      title: "Only Title",
      url: "https://example.com",
      normalizedUrl: "example.com",
      description: null,
      domain: null,
      tags: [],
    });
    expect(result).not.toMatch(/\s{2,}/);
  });
});

// ─── tokenizeQuery ────────────────────────────────────────────────────────────

describe("tokenizeQuery", () => {
  it("splits on whitespace and lowercases each token", () => {
    expect(tokenizeQuery("React Hooks")).toEqual(["react", "hooks"]);
  });

  it("returns an empty array for an empty string", () => {
    expect(tokenizeQuery("")).toEqual([]);
  });

  it("returns an empty array for whitespace-only input", () => {
    expect(tokenizeQuery("   ")).toEqual([]);
  });

  it("trims and splits a string with leading/trailing whitespace", () => {
    expect(tokenizeQuery("  typescript  generics  ")).toEqual(["typescript", "generics"]);
  });

  it("deduplicates repeated tokens", () => {
    expect(tokenizeQuery("react react REACT")).toEqual(["react"]);
  });

  it("deduplicates across case variants", () => {
    expect(tokenizeQuery("hooks Hooks HOOKS")).toEqual(["hooks"]);
  });

  it("handles a single token", () => {
    expect(tokenizeQuery("vitest")).toEqual(["vitest"]);
  });

  it("handles tokens separated by multiple spaces", () => {
    expect(tokenizeQuery("a   b    c")).toEqual(["a", "b", "c"]);
  });

  it("handles tokens separated by tabs and newlines", () => {
    expect(tokenizeQuery("css\tlayout\ngrid")).toEqual(["css", "layout", "grid"]);
  });

  it("preserves partial-word tokens as-is (no stemming)", () => {
    expect(tokenizeQuery("reac")).toEqual(["reac"]);
  });

  it("does not strip punctuation from tokens", () => {
    expect(tokenizeQuery("react.dev")).toEqual(["react.dev"]);
  });
});

// ─── matchesSearchQuery ───────────────────────────────────────────────────────

describe("matchesSearchQuery", () => {
  describe("empty / blank query", () => {
    it("returns true for an empty query", () => {
      expect(matchesSearchQuery(makeBookmark(), "")).toBe(true);
    });

    it("returns true for a whitespace-only query", () => {
      expect(matchesSearchQuery(makeBookmark(), "   ")).toBe(true);
    });
  });

  describe("title matching", () => {
    it("matches a term found in the title", () => {
      const bm = makeBookmark({ title: "React Hooks Guide" });
      expect(matchesSearchQuery(bm, "hooks")).toBe(true);
    });

    it("is case-insensitive for title matches", () => {
      const bm = makeBookmark({ title: "React Hooks Guide" });
      expect(matchesSearchQuery(bm, "HOOKS")).toBe(true);
    });

    it("does not match a term absent from the title (or any field)", () => {
      const bm = makeBookmark({ title: "React Hooks Guide", description: null, tags: [] });
      expect(matchesSearchQuery(bm, "svelte")).toBe(false);
    });
  });

  describe("URL matching", () => {
    it("matches a subdomain token in the URL", () => {
      const bm = makeBookmark({ url: "https://developer.mozilla.org/en-US/docs/Web/CSS" });
      expect(matchesSearchQuery(bm, "mozilla")).toBe(true);
    });

    it("matches a path segment in the URL", () => {
      const bm = makeBookmark({ url: "https://react.dev/reference/react/hooks" });
      expect(matchesSearchQuery(bm, "reference")).toBe(true);
    });
  });

  describe("normalizedUrl matching", () => {
    it("matches a token present in the normalizedUrl", () => {
      const bm = makeBookmark({ normalizedUrl: "npmjs.com/package/react" });
      expect(matchesSearchQuery(bm, "package")).toBe(true);
    });
  });

  describe("description matching", () => {
    it("matches a term found in the description", () => {
      const bm = makeBookmark({ description: "Deep dive into React concurrent mode" });
      expect(matchesSearchQuery(bm, "concurrent")).toBe(true);
    });

    it("still matches other fields when description is null", () => {
      const bm = makeBookmark({ description: null, title: "Vitest Guide" });
      expect(matchesSearchQuery(bm, "vitest")).toBe(true);
    });
  });

  describe("domain matching", () => {
    it("matches a token found in the domain", () => {
      const bm = makeBookmark({ domain: "css-tricks.com" });
      expect(matchesSearchQuery(bm, "css-tricks.com")).toBe(true);
    });

    it("still matches when domain is null", () => {
      const bm = makeBookmark({ domain: null, title: "Tailwind CSS" });
      expect(matchesSearchQuery(bm, "tailwind")).toBe(true);
    });
  });

  describe("tag matching", () => {
    it("matches a term that is an exact tag", () => {
      const bm = makeBookmark({ tags: ["react", "typescript"] });
      expect(matchesSearchQuery(bm, "typescript")).toBe(true);
    });

    it("matches a term that is a substring of a tag", () => {
      const bm = makeBookmark({ tags: ["typescript"] });
      expect(matchesSearchQuery(bm, "type")).toBe(true);
    });

    it("returns false when query is not in any tag (or other fields)", () => {
      const bm = makeBookmark({
        title: "CSS Grid",
        url: "https://css-tricks.com/grid",
        normalizedUrl: "css-tricks.com/grid",
        description: null,
        domain: "css-tricks.com",
        tags: ["css", "grid"],
      });
      expect(matchesSearchQuery(bm, "react")).toBe(false);
    });
  });

  describe("multi-token queries (AND semantics)", () => {
    it("matches when all tokens are present across different fields", () => {
      const bm = makeBookmark({
        title: "RTK Query",
        description: "Redux Toolkit async data fetching",
        tags: ["redux"],
      });
      expect(matchesSearchQuery(bm, "rtk redux")).toBe(true);
    });

    it("returns false when one token is missing", () => {
      const bm = makeBookmark({
        title: "RTK Query",
        description: "Redux Toolkit",
        tags: [],
      });
      expect(matchesSearchQuery(bm, "rtk svelte")).toBe(false);
    });

    it("deduplicates repeated tokens before matching (duplicate token not required twice)", () => {
      const bm = makeBookmark({ title: "React Guide" });
      // "react react" deduplicates to ["react"] — should still match
      expect(matchesSearchQuery(bm, "react react")).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("matches a single-character token if it appears in the text", () => {
      const bm = makeBookmark({ title: "A guide to CSS" });
      expect(matchesSearchQuery(bm, "a")).toBe(true);
    });

    it("returns false for a bookmark with all-null optional fields and a non-trivial query", () => {
      const bm = makeBookmark({
        title: "Plain Title",
        url: "https://example.com",
        normalizedUrl: "example.com",
        description: null,
        domain: null,
        tags: [],
      });
      expect(matchesSearchQuery(bm, "react")).toBe(false);
    });
  });
});

// ─── normalizeSearchQuery ─────────────────────────────────────────────────────

describe("normalizeSearchQuery", () => {
  it("trims leading and trailing whitespace", () => {
    expect(normalizeSearchQuery("  react  ")).toBe("react");
  });

  it("collapses internal whitespace runs to a single space", () => {
    expect(normalizeSearchQuery("react   hooks")).toBe("react hooks");
  });

  it("collapses tabs and newlines to a single space", () => {
    expect(normalizeSearchQuery("react\t\thooks\nquery")).toBe("react hooks query");
  });

  it("returns an empty string for an empty input", () => {
    expect(normalizeSearchQuery("")).toBe("");
  });

  it("returns an empty string for whitespace-only input", () => {
    expect(normalizeSearchQuery("   ")).toBe("");
  });

  it("preserves a single token unchanged", () => {
    expect(normalizeSearchQuery("typescript")).toBe("typescript");
  });

  it("preserves quoted phrases unchanged (for websearch_to_tsquery phrase support)", () => {
    expect(normalizeSearchQuery('"react hooks"')).toBe('"react hooks"');
  });

  it("preserves negation operator for websearch syntax", () => {
    expect(normalizeSearchQuery("react -svelte")).toBe("react -svelte");
  });

  it("does not lowercase the query (Postgres websearch handles casing)", () => {
    expect(normalizeSearchQuery("React Hooks")).toBe("React Hooks");
  });
});
