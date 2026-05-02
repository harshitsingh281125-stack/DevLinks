import { describe, expect, it } from "vitest";
import { RESOURCE_TYPES } from "@/lib/types";
import { canonicalizeUrl, mapBookmarkRow } from "./bookmarksApi";

// ─── canonicalizeUrl ──────────────────────────────────────────────────────────
// Must mirror the Postgres function normalize_bookmark_url used by the DB trigger.
// Steps: lowercase → trim → strip protocol → strip www → strip hash/query → strip trailing slash.

describe("canonicalizeUrl", () => {
  describe("protocol stripping", () => {
    it("strips https:// prefix", () => {
      expect(canonicalizeUrl("https://react.dev/learn")).toBe("react.dev/learn");
    });

    it("strips http:// prefix", () => {
      expect(canonicalizeUrl("http://example.com/page")).toBe("example.com/page");
    });

    it("leaves protocol-relative URLs unchanged", () => {
      // No https?:// match — returned as-is (after other transforms)
      expect(canonicalizeUrl("//example.com/page")).toBe("//example.com/page");
    });
  });

  describe("www stripping", () => {
    it("strips www. prefix", () => {
      expect(canonicalizeUrl("https://www.github.com/user/repo")).toBe("github.com/user/repo");
    });

    it("strips www2. prefix", () => {
      expect(canonicalizeUrl("https://www2.example.com/page")).toBe("example.com/page");
    });

    it("strips www10. prefix", () => {
      expect(canonicalizeUrl("https://www10.example.com/path")).toBe("example.com/path");
    });

    it("does not strip a non-www subdomain", () => {
      expect(canonicalizeUrl("https://docs.example.com/path")).toBe("docs.example.com/path");
    });

    it("does not strip 'www' that is part of the domain name", () => {
      // e.g. www-example.com should not be altered beyond the protocol strip
      expect(canonicalizeUrl("https://www-example.com/page")).toBe("www-example.com/page");
    });
  });

  describe("hash and query stripping", () => {
    it("strips the hash fragment", () => {
      expect(canonicalizeUrl("https://example.com/docs#section")).toBe("example.com/docs");
    });

    it("strips the query string", () => {
      expect(canonicalizeUrl("https://example.com/search?q=react")).toBe("example.com/search");
    });

    it("strips both query and hash when both present", () => {
      expect(canonicalizeUrl("https://example.com/docs?v=2#top")).toBe("example.com/docs");
    });

    it("strips a hash at the root", () => {
      expect(canonicalizeUrl("https://example.com/#about")).toBe("example.com");
    });
  });

  describe("trailing slash stripping", () => {
    it("strips a single trailing slash from path", () => {
      expect(canonicalizeUrl("https://react.dev/learn/")).toBe("react.dev/learn");
    });

    it("strips multiple trailing slashes", () => {
      expect(canonicalizeUrl("https://example.com/path//")).toBe("example.com/path");
    });

    it("strips trailing slash from root (leaving bare domain)", () => {
      expect(canonicalizeUrl("https://example.com/")).toBe("example.com");
    });
  });

  describe("lowercasing", () => {
    it("lowercases the entire result", () => {
      expect(canonicalizeUrl("https://EXAMPLE.COM/Path/To/Page")).toBe("example.com/path/to/page");
    });

    it("lowercases even without protocol", () => {
      expect(canonicalizeUrl("Example.Com/Page")).toBe("example.com/page");
    });
  });

  describe("combined transforms", () => {
    it("strips protocol + www + query + trailing slash", () => {
      expect(canonicalizeUrl("https://www.npmjs.com/package/react?activeTab=readme")).toBe(
        "npmjs.com/package/react",
      );
    });

    it("handles a bare domain with no path", () => {
      expect(canonicalizeUrl("https://github.com")).toBe("github.com");
    });

    it("handles a deep path with no extras", () => {
      expect(canonicalizeUrl("https://developer.mozilla.org/en-US/docs/Web/CSS/grid")).toBe(
        "developer.mozilla.org/en-us/docs/web/css/grid",
      );
    });

    it("two URLs that differ only by hash and trailing slash produce the same canonical form", () => {
      const a = canonicalizeUrl("https://react.dev/learn/#quick-start");
      const b = canonicalizeUrl("https://react.dev/learn/");
      expect(a).toBe(b);
    });

    it("two URLs that differ only by www produce the same canonical form", () => {
      const a = canonicalizeUrl("https://www.smashingmagazine.com/article/");
      const b = canonicalizeUrl("https://smashingmagazine.com/article");
      expect(a).toBe(b);
    });
  });

  describe("whitespace handling", () => {
    it("trims leading and trailing whitespace", () => {
      expect(canonicalizeUrl("  https://example.com/page  ")).toBe("example.com/page");
    });
  });
});

// ─── mapBookmarkRow ───────────────────────────────────────────────────────────

describe("mapBookmarkRow", () => {
  const baseRow = {
    id: "bm-1",
    user_id: "user-1",
    collection_id: "col-1",
    title: "React Docs",
    url: "https://react.dev/learn",
    normalized_url: "react.dev/learn",
    description: "Official React documentation",
    domain: "react.dev",
    favicon_url: "https://react.dev/favicon.ico",
    image_url: "https://react.dev/og.png",
    resource_type: "documentation",
    tags: ["react", "javascript"],
    search_text: "react docs documentation react javascript",
    created_at: "2026-04-18T10:00:00Z",
    updated_at: "2026-04-18T10:00:00Z",
  };

  it("maps snake_case id fields to camelCase", () => {
    const bookmark = mapBookmarkRow(baseRow);
    expect(bookmark.id).toBe("bm-1");
    expect(bookmark.userId).toBe("user-1");
    expect(bookmark.collectionId).toBe("col-1");
  });

  it("maps url fields correctly", () => {
    const bookmark = mapBookmarkRow(baseRow);
    expect(bookmark.url).toBe("https://react.dev/learn");
    expect(bookmark.normalizedUrl).toBe("react.dev/learn");
  });

  it("maps text content fields", () => {
    const bookmark = mapBookmarkRow(baseRow);
    expect(bookmark.title).toBe("React Docs");
    expect(bookmark.description).toBe("Official React documentation");
    expect(bookmark.domain).toBe("react.dev");
    expect(bookmark.searchText).toBe("react docs documentation react javascript");
  });

  it("maps image fields", () => {
    const bookmark = mapBookmarkRow(baseRow);
    expect(bookmark.faviconUrl).toBe("https://react.dev/favicon.ico");
    expect(bookmark.imageUrl).toBe("https://react.dev/og.png");
  });

  it("maps resourceType from string", () => {
    const bookmark = mapBookmarkRow(baseRow);
    expect(bookmark.resourceType).toBe("documentation");
  });

  it("maps tags array", () => {
    const bookmark = mapBookmarkRow(baseRow);
    expect(bookmark.tags).toEqual(["react", "javascript"]);
  });

  it("maps timestamp fields", () => {
    const bookmark = mapBookmarkRow(baseRow);
    expect(bookmark.createdAt).toBe("2026-04-18T10:00:00Z");
    expect(bookmark.updatedAt).toBe("2026-04-18T10:00:00Z");
  });

  it("preserves null for optional fields", () => {
    const rowWithNulls = {
      ...baseRow,
      description: null,
      domain: null,
      favicon_url: null,
      image_url: null,
      resource_type: null,
    };
    const bookmark = mapBookmarkRow(rowWithNulls);
    expect(bookmark.description).toBeNull();
    expect(bookmark.domain).toBeNull();
    expect(bookmark.faviconUrl).toBeNull();
    expect(bookmark.imageUrl).toBeNull();
    expect(bookmark.resourceType).toBeNull();
  });

  it("maps an empty tags array", () => {
    const bookmark = mapBookmarkRow({ ...baseRow, tags: [] });
    expect(bookmark.tags).toEqual([]);
  });

  it("produces a Bookmark with every required key present", () => {
    const bookmark = mapBookmarkRow(baseRow);
    const requiredKeys: (keyof typeof bookmark)[] = [
      "id",
      "userId",
      "collectionId",
      "title",
      "url",
      "normalizedUrl",
      "description",
      "domain",
      "faviconUrl",
      "imageUrl",
      "resourceType",
      "tags",
      "searchText",
      "createdAt",
      "updatedAt",
    ];
    for (const key of requiredKeys) {
      expect(Object.prototype.hasOwnProperty.call(bookmark, key)).toBe(true);
    }
  });
});

// ─── mapBookmarkRow — resource_type coverage ──────────────────────────────────
// Verifies every KnownResourceType round-trips through the mapper unchanged.
// This matters for the bookmark list and edit modal which display and pre-populate
// resource_type from stored rows.

describe("mapBookmarkRow — resource_type round-trip", () => {
  const baseRow = {
    id: "bm-1",
    user_id: "user-1",
    collection_id: "col-1",
    title: "Test",
    url: "https://example.com",
    normalized_url: "example.com",
    description: null,
    domain: "example.com",
    favicon_url: null,
    image_url: null,
    resource_type: "article",
    tags: [],
    search_text: "test",
    created_at: "2026-04-19T00:00:00Z",
    updated_at: "2026-04-19T00:00:00Z",
  };

  it.each(RESOURCE_TYPES)("maps resource_type '%s' to bookmark.resourceType", (type) => {
    const bookmark = mapBookmarkRow({ ...baseRow, resource_type: type });
    expect(bookmark.resourceType).toBe(type);
  });

  it("preserves an unknown/custom resource_type string as-is", () => {
    const bookmark = mapBookmarkRow({ ...baseRow, resource_type: "custom-internal-type" });
    expect(bookmark.resourceType).toBe("custom-internal-type");
  });

  it("maps null resource_type to null", () => {
    const bookmark = mapBookmarkRow({ ...baseRow, resource_type: null });
    expect(bookmark.resourceType).toBeNull();
  });
});

// ─── getBookmarks list transformation ────────────────────────────────────────
// Verifies that applying mapBookmarkRow over an array (the pattern used by the
// getBookmarks query) preserves order, count, and per-row correctness.

describe("getBookmarks list transformation", () => {
  const makeRow = (id: string, title: string) => ({
    id,
    user_id: "user-1",
    collection_id: "col-1",
    title,
    url: `https://example.com/${id}`,
    normalized_url: `example.com/${id}`,
    description: null,
    domain: "example.com",
    favicon_url: null,
    image_url: null,
    resource_type: "article",
    tags: ["react"],
    search_text: title,
    created_at: "2026-04-19T00:00:00Z",
    updated_at: "2026-04-19T00:00:00Z",
  });

  it("maps an empty row array to an empty Bookmark array", () => {
    expect([].map(mapBookmarkRow)).toEqual([]);
  });

  it("preserves the order of rows after mapping", () => {
    const rows = [makeRow("bm-1", "First"), makeRow("bm-2", "Second"), makeRow("bm-3", "Third")];
    const bookmarks = rows.map(mapBookmarkRow);
    expect(bookmarks.map((b) => b.id)).toEqual(["bm-1", "bm-2", "bm-3"]);
  });

  it("maps each row independently without cross-contamination", () => {
    const rows = [
      makeRow("bm-1", "Alpha"),
      { ...makeRow("bm-2", "Beta"), resource_type: "video", tags: ["css", "animation"] },
    ];
    const bookmarks = rows.map(mapBookmarkRow);
    expect(bookmarks[0].resourceType).toBe("article");
    expect(bookmarks[0].tags).toEqual(["react"]);
    expect(bookmarks[1].resourceType).toBe("video");
    expect(bookmarks[1].tags).toEqual(["css", "animation"]);
  });

  it("preserves a bookmark with many tags", () => {
    const manyTags = ["react", "typescript", "hooks", "testing", "vitest", "rtk-query", "supabase"];
    const row = { ...makeRow("bm-1", "Tagged"), tags: manyTags };
    const bookmark = mapBookmarkRow(row);
    expect(bookmark.tags).toHaveLength(manyTags.length);
    expect(bookmark.tags).toEqual(manyTags);
  });
});

// ─── updateBookmark — row mapper compatibility ────────────────────────────────
// The updateBookmark mutation returns a single row mapped via mapBookmarkRow.
// These tests verify the mapper correctly handles all fields that the edit form
// can change: title, description, resource_type, tags, and collection_id.

describe("mapBookmarkRow — edit-flow field mutations", () => {
  const originalRow = {
    id: "bm-edit-1",
    user_id: "user-1",
    collection_id: "col-original",
    title: "Original Title",
    url: "https://react.dev/learn",
    normalized_url: "react.dev/learn",
    description: "Original description",
    domain: "react.dev",
    favicon_url: "https://react.dev/favicon.ico",
    image_url: null,
    resource_type: "article",
    tags: ["react"],
    search_text: "original title react",
    created_at: "2026-04-19T00:00:00Z",
    updated_at: "2026-04-19T00:00:00Z",
  };

  it("reflects a title update", () => {
    const updatedRow = { ...originalRow, title: "Updated Title" };
    expect(mapBookmarkRow(updatedRow).title).toBe("Updated Title");
  });

  it("reflects a description update (string → null)", () => {
    const updatedRow = { ...originalRow, description: null };
    expect(mapBookmarkRow(updatedRow).description).toBeNull();
  });

  it("reflects a description update (null → string)", () => {
    const updatedRow = { ...originalRow, description: "New description" };
    expect(mapBookmarkRow(updatedRow).description).toBe("New description");
  });

  it("reflects a resource_type change", () => {
    const updatedRow = { ...originalRow, resource_type: "video" };
    expect(mapBookmarkRow(updatedRow).resourceType).toBe("video");
  });

  it("reflects a tags replacement", () => {
    const updatedRow = { ...originalRow, tags: ["typescript", "hooks", "testing"] };
    expect(mapBookmarkRow(updatedRow).tags).toEqual(["typescript", "hooks", "testing"]);
  });

  it("reflects clearing all tags", () => {
    const updatedRow = { ...originalRow, tags: [] };
    expect(mapBookmarkRow(updatedRow).tags).toEqual([]);
  });

  it("reflects a collection reassignment", () => {
    const updatedRow = { ...originalRow, collection_id: "col-new" };
    expect(mapBookmarkRow(updatedRow).collectionId).toBe("col-new");
  });

  it("unmodified fields survive an edit", () => {
    const updatedRow = { ...originalRow, title: "Changed" };
    const bookmark = mapBookmarkRow(updatedRow);
    expect(bookmark.id).toBe("bm-edit-1");
    expect(bookmark.url).toBe("https://react.dev/learn");
    expect(bookmark.normalizedUrl).toBe("react.dev/learn");
    expect(bookmark.domain).toBe("react.dev");
    expect(bookmark.faviconUrl).toBe("https://react.dev/favicon.ico");
  });
});
