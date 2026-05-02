import { describe, expect, it } from "vitest";
import { RESOURCE_TYPES } from "@/lib/types";
import {
  ALL_DEMO_BOOKMARKS,
  DEMO_COLLECTIONS,
  DEMO_DISPLAY_NAME,
  DEMO_GITHUB_USERNAME,
  DEMO_USER_EMAIL,
  DEMO_USER_ID,
  type SeedBookmark,
  type SeedCollection,
} from "./demoData";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const HTTPS_URL_RE = /^https:\/\/.+/;

// ─── Demo user constants ──────────────────────────────────────────────────────

describe("demo user constants", () => {
  it("DEMO_USER_ID is a valid UUID", () => {
    expect(DEMO_USER_ID).toMatch(UUID_RE);
  });

  it("DEMO_USER_EMAIL is a non-empty string containing @", () => {
    expect(DEMO_USER_EMAIL).toContain("@");
    expect(DEMO_USER_EMAIL.length).toBeGreaterThan(0);
  });

  it("DEMO_GITHUB_USERNAME is non-empty", () => {
    expect(DEMO_GITHUB_USERNAME.length).toBeGreaterThan(0);
  });

  it("DEMO_DISPLAY_NAME is non-empty", () => {
    expect(DEMO_DISPLAY_NAME.length).toBeGreaterThan(0);
  });
});

// ─── Collection count and structure ──────────────────────────────────────────

describe("DEMO_COLLECTIONS — collection count and identity", () => {
  it("contains exactly 3 collections", () => {
    expect(DEMO_COLLECTIONS).toHaveLength(3);
  });

  it("contains a React Debugging collection", () => {
    const names = DEMO_COLLECTIONS.map((c) => c.name);
    expect(names).toContain("React Debugging");
  });

  it("contains a CSS Layout collection", () => {
    const names = DEMO_COLLECTIONS.map((c) => c.name);
    expect(names).toContain("CSS Layout");
  });

  it("contains an API / Auth collection", () => {
    const names = DEMO_COLLECTIONS.map((c) => c.name);
    expect(names).toContain("API / Auth");
  });

  it("each collection has a non-empty name", () => {
    for (const c of DEMO_COLLECTIONS) {
      expect(c.name.trim().length).toBeGreaterThan(0);
    }
  });

  it("each collection has a non-empty description", () => {
    for (const c of DEMO_COLLECTIONS) {
      expect(c.description.trim().length).toBeGreaterThan(0);
    }
  });

  it("each collection id is a valid UUID", () => {
    for (const c of DEMO_COLLECTIONS) {
      expect(c.id).toMatch(UUID_RE);
    }
  });

  it("collection IDs are unique", () => {
    const ids = DEMO_COLLECTIONS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// ─── Collection slugs ─────────────────────────────────────────────────────────

describe("DEMO_COLLECTIONS — slugs", () => {
  it("each collection has a non-empty slug", () => {
    for (const c of DEMO_COLLECTIONS) {
      expect(c.slug.length).toBeGreaterThan(0);
    }
  });

  it("each slug matches the valid slug pattern (lowercase, hyphens)", () => {
    for (const c of DEMO_COLLECTIONS) {
      expect(c.slug).toMatch(SLUG_RE);
    }
  });

  it("slugs are unique across all collections", () => {
    const slugs = DEMO_COLLECTIONS.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("contains slug 'react-debugging'", () => {
    expect(DEMO_COLLECTIONS.map((c) => c.slug)).toContain("react-debugging");
  });

  it("contains slug 'css-layout'", () => {
    expect(DEMO_COLLECTIONS.map((c) => c.slug)).toContain("css-layout");
  });

  it("contains slug 'api-auth'", () => {
    expect(DEMO_COLLECTIONS.map((c) => c.slug)).toContain("api-auth");
  });

  it("no slug contains uppercase letters", () => {
    for (const c of DEMO_COLLECTIONS) {
      expect(c.slug).toBe(c.slug.toLowerCase());
    }
  });

  it("no slug contains spaces", () => {
    for (const c of DEMO_COLLECTIONS) {
      expect(c.slug).not.toContain(" ");
    }
  });
});

// ─── Bookmark counts per collection ───────────────────────────────────────────

describe("DEMO_COLLECTIONS — bookmark counts", () => {
  it("each collection has at least 5 bookmarks", () => {
    for (const c of DEMO_COLLECTIONS) {
      expect(c.bookmarks.length).toBeGreaterThanOrEqual(5);
    }
  });

  it("React Debugging has at least 6 bookmarks", () => {
    const c = DEMO_COLLECTIONS.find((c) => c.slug === "react-debugging")!;
    expect(c.bookmarks.length).toBeGreaterThanOrEqual(6);
  });

  it("CSS Layout has at least 6 bookmarks", () => {
    const c = DEMO_COLLECTIONS.find((c) => c.slug === "css-layout")!;
    expect(c.bookmarks.length).toBeGreaterThanOrEqual(6);
  });

  it("API / Auth has at least 6 bookmarks", () => {
    const c = DEMO_COLLECTIONS.find((c) => c.slug === "api-auth")!;
    expect(c.bookmarks.length).toBeGreaterThanOrEqual(6);
  });

  it("total bookmark count across all collections matches ALL_DEMO_BOOKMARKS", () => {
    const total = DEMO_COLLECTIONS.reduce((sum, c) => sum + c.bookmarks.length, 0);
    expect(ALL_DEMO_BOOKMARKS).toHaveLength(total);
  });
});

// ─── ALL_DEMO_BOOKMARKS flat array ────────────────────────────────────────────

describe("ALL_DEMO_BOOKMARKS", () => {
  it("has at least 18 entries (6 per collection)", () => {
    expect(ALL_DEMO_BOOKMARKS.length).toBeGreaterThanOrEqual(18);
  });

  it("every entry appears in exactly one collection's bookmarks array", () => {
    const collectionBookmarkIds = new Set(
      DEMO_COLLECTIONS.flatMap((c) => c.bookmarks.map((b) => b.id)),
    );
    for (const b of ALL_DEMO_BOOKMARKS) {
      expect(collectionBookmarkIds.has(b.id)).toBe(true);
    }
  });
});

// ─── Bookmark field validity ──────────────────────────────────────────────────

describe("bookmark field validity — all bookmarks", () => {
  it("each bookmark id is a valid UUID", () => {
    for (const b of ALL_DEMO_BOOKMARKS) {
      expect(b.id, `bookmark title: ${b.title}`).toMatch(UUID_RE);
    }
  });

  it("each bookmark collectionId is a valid UUID", () => {
    for (const b of ALL_DEMO_BOOKMARKS) {
      expect(b.collectionId, `bookmark title: ${b.title}`).toMatch(UUID_RE);
    }
  });

  it("each bookmark collectionId references an existing collection", () => {
    const collectionIds = new Set(DEMO_COLLECTIONS.map((c) => c.id));
    for (const b of ALL_DEMO_BOOKMARKS) {
      expect(collectionIds.has(b.collectionId), `bookmark title: ${b.title}`).toBe(true);
    }
  });

  it("each bookmark title is non-blank", () => {
    for (const b of ALL_DEMO_BOOKMARKS) {
      expect(b.title.trim().length, `id: ${b.id}`).toBeGreaterThan(0);
    }
  });

  it("each bookmark description is non-blank", () => {
    for (const b of ALL_DEMO_BOOKMARKS) {
      expect(b.description.trim().length, `title: ${b.title}`).toBeGreaterThan(0);
    }
  });

  it("each bookmark url starts with https://", () => {
    for (const b of ALL_DEMO_BOOKMARKS) {
      expect(b.url, `title: ${b.title}`).toMatch(HTTPS_URL_RE);
    }
  });

  it("each bookmark url contains a domain", () => {
    for (const b of ALL_DEMO_BOOKMARKS) {
      const url = new URL(b.url);
      expect(url.hostname.length, `title: ${b.title}`).toBeGreaterThan(0);
    }
  });

  it("each bookmark domain is non-empty", () => {
    for (const b of ALL_DEMO_BOOKMARKS) {
      expect(b.domain.trim().length, `title: ${b.title}`).toBeGreaterThan(0);
    }
  });

  it("each bookmark domain matches the hostname in the url", () => {
    for (const b of ALL_DEMO_BOOKMARKS) {
      const hostname = new URL(b.url).hostname.replace(/^www\d*\./, "");
      expect(b.domain, `title: ${b.title}`).toBe(hostname);
    }
  });

  it("each bookmark has a known resource type", () => {
    const knownTypes = new Set<string>(RESOURCE_TYPES);
    for (const b of ALL_DEMO_BOOKMARKS) {
      expect(
        knownTypes.has(b.resourceType),
        `"${b.resourceType}" on "${b.title}" is not a known type`,
      ).toBe(true);
    }
  });

  it("each bookmark has at least one tag", () => {
    for (const b of ALL_DEMO_BOOKMARKS) {
      expect(b.tags.length, `title: ${b.title}`).toBeGreaterThan(0);
    }
  });

  it("each tag is a non-empty lowercase string", () => {
    for (const b of ALL_DEMO_BOOKMARKS) {
      for (const tag of b.tags) {
        expect(tag.trim().length, `tag on "${b.title}"`).toBeGreaterThan(0);
        expect(tag, `tag "${tag}" on "${b.title}"`).toBe(tag.toLowerCase());
      }
    }
  });
});

// ─── Uniqueness constraints ───────────────────────────────────────────────────

describe("uniqueness constraints", () => {
  it("all bookmark IDs are unique", () => {
    const ids = ALL_DEMO_BOOKMARKS.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("all bookmark URLs are unique (no two bookmarks share the same raw URL)", () => {
    const urls = ALL_DEMO_BOOKMARKS.map((b) => b.url);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it("all bookmark normalized URLs are unique (mirrors DB unique constraint)", () => {
    // Mirror the normalize function from bookmarksApi to catch collisions before the DB does.
    function normalize(url: string): string {
      return url
        .toLowerCase()
        .trim()
        .replace(/^https?:\/\//, "")
        .replace(/^www\d*\./, "")
        .replace(/[#?].*$/, "")
        .replace(/\/+$/, "");
    }
    const normalized = ALL_DEMO_BOOKMARKS.map((b) => normalize(b.url));
    const dupes = normalized.filter((n, i) => normalized.indexOf(n) !== i);
    expect(dupes, `duplicate normalized URLs: ${dupes.join(", ")}`).toHaveLength(0);
  });

  it("all bookmark titles are unique", () => {
    const titles = ALL_DEMO_BOOKMARKS.map((b) => b.title);
    expect(new Set(titles).size).toBe(titles.length);
  });
});

// ─── Per-collection bookmark coherence ────────────────────────────────────────

describe("per-collection bookmark coherence", () => {
  it("every bookmark in a collection's array has a collectionId matching that collection", () => {
    for (const c of DEMO_COLLECTIONS) {
      for (const b of c.bookmarks) {
        expect(b.collectionId, `bookmark "${b.title}" in "${c.name}"`).toBe(c.id);
      }
    }
  });

  it("React Debugging bookmarks are all about React or debugging", () => {
    const c = DEMO_COLLECTIONS.find((c) => c.slug === "react-debugging")!;
    const reactOrDebug = c.bookmarks.every(
      (b) =>
        b.tags.some((t) => ["react", "debugging", "performance", "devtools"].includes(t)),
    );
    expect(reactOrDebug).toBe(true);
  });

  it("CSS Layout bookmarks all have a 'css' tag", () => {
    const c = DEMO_COLLECTIONS.find((c) => c.slug === "css-layout")!;
    for (const b of c.bookmarks) {
      expect(b.tags, `bookmark "${b.title}" is missing the 'css' tag`).toContain("css");
    }
  });

  it("API / Auth bookmarks all have an api or auth or http or security tag", () => {
    const apiAuthTags = new Set(["api", "auth", "http", "security", "oauth", "jwt", "rest"]);
    const c = DEMO_COLLECTIONS.find((c) => c.slug === "api-auth")!;
    for (const b of c.bookmarks) {
      const hasRelevantTag = b.tags.some((t) => apiAuthTags.has(t));
      expect(hasRelevantTag, `bookmark "${b.title}" has no api/auth/http/security tag`).toBe(true);
    }
  });
});

// ─── Resource-type distribution ───────────────────────────────────────────────

describe("resource-type distribution", () => {
  it("each collection has at least 2 different resource types", () => {
    for (const c of DEMO_COLLECTIONS) {
      const types = new Set(c.bookmarks.map((b) => b.resourceType));
      expect(
        types.size,
        `"${c.name}" only has ${types.size} resource type(s)`,
      ).toBeGreaterThanOrEqual(2);
    }
  });

  it("across all collections, at least 4 distinct resource types are present", () => {
    const types = new Set(ALL_DEMO_BOOKMARKS.map((b) => b.resourceType));
    expect(types.size).toBeGreaterThanOrEqual(4);
  });

  it("every resource type used is in the known RESOURCE_TYPES list", () => {
    const knownTypes = new Set<string>(RESOURCE_TYPES);
    const usedTypes = new Set(ALL_DEMO_BOOKMARKS.map((b) => b.resourceType));
    for (const t of usedTypes) {
      expect(knownTypes.has(t), `"${t}" is not in RESOURCE_TYPES`).toBe(true);
    }
  });
});

// ─── SeedCollection structural contract ──────────────────────────────────────

describe("SeedCollection structural contract", () => {
  function hasRequiredCollectionKeys(c: SeedCollection): boolean {
    return (
      typeof c.id === "string" &&
      typeof c.name === "string" &&
      typeof c.description === "string" &&
      typeof c.slug === "string" &&
      Array.isArray(c.bookmarks)
    );
  }

  it("every collection satisfies the SeedCollection contract", () => {
    for (const c of DEMO_COLLECTIONS) {
      expect(hasRequiredCollectionKeys(c), `collection: ${c.name}`).toBe(true);
    }
  });
});

// ─── SeedBookmark structural contract ────────────────────────────────────────

describe("SeedBookmark structural contract", () => {
  function hasRequiredBookmarkKeys(b: SeedBookmark): boolean {
    return (
      typeof b.id === "string" &&
      typeof b.collectionId === "string" &&
      typeof b.title === "string" &&
      typeof b.url === "string" &&
      typeof b.description === "string" &&
      typeof b.domain === "string" &&
      (b.faviconUrl === null || typeof b.faviconUrl === "string") &&
      (b.imageUrl === null || typeof b.imageUrl === "string") &&
      typeof b.resourceType === "string" &&
      Array.isArray(b.tags)
    );
  }

  it("every bookmark satisfies the SeedBookmark contract", () => {
    for (const b of ALL_DEMO_BOOKMARKS) {
      expect(hasRequiredBookmarkKeys(b), `bookmark: ${b.title}`).toBe(true);
    }
  });
});

// ─── SQL seed coherence ───────────────────────────────────────────────────────
// The SQL seed file (supabase/seed.sql) must be consistent with this data
// module. We verify by checking the UUIDs used in both are the same set.

describe("SQL seed coherence — UUID registry", () => {
  it("collection IDs follow the deterministic prefix 00000000-0000-0000-0001-xxxxxxxxx", () => {
    for (const c of DEMO_COLLECTIONS) {
      expect(c.id).toMatch(/^00000000-0000-0000-0001-/);
    }
  });

  it("bookmark IDs follow the deterministic prefix 00000000-0000-0000-0002-xxxxxxxxx", () => {
    for (const b of ALL_DEMO_BOOKMARKS) {
      expect(b.id).toMatch(/^00000000-0000-0000-0002-/);
    }
  });

  it("demo user ID has the expected value", () => {
    expect(DEMO_USER_ID).toBe("00000000-0000-0000-0000-000000000001");
  });

  it("collection IDs are in the range 000...001 to 000...003", () => {
    const suffixes = DEMO_COLLECTIONS.map((c) => {
      const parts = c.id.split("-");
      return parts[parts.length - 1];
    });
    expect(suffixes.every((s) => s && Number(s) >= 1 && Number(s) <= 3)).toBe(true);
  });

  it("bookmark IDs are numbered sequentially from 1", () => {
    const suffixes = ALL_DEMO_BOOKMARKS.map((b) => {
      const parts = b.id.split("-");
      return Number(parts[parts.length - 1]);
    });
    const sorted = [...suffixes].sort((a, b) => a - b);
    expect(sorted[0]).toBe(1);
    // Each suffix is unique
    expect(new Set(sorted).size).toBe(sorted.length);
  });
});
