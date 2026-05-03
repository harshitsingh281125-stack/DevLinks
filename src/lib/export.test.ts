import { describe, expect, it } from "vitest";
import type { Bookmark, Collection } from "./types";
import {
  formatDate,
  slugify,
  serializeCollectionJson,
  serializeAllJson,
  serializeCollectionMarkdown,
  serializeAllMarkdown,
} from "./export";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const col: Collection = {
  id: "col-1",
  userId: "u1",
  name: "Learning Rust",
  description: "My Rust reading list",
  slug: "learning-rust",
  isPublic: true,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

const col2: Collection = {
  id: "col-2",
  userId: "u1",
  name: "Frontend",
  description: null,
  slug: "frontend",
  isPublic: false,
  createdAt: "2026-01-02T00:00:00Z",
  updatedAt: "2026-01-02T00:00:00Z",
};

const bm1: Bookmark = {
  id: "bm-1",
  userId: "u1",
  collectionId: "col-1",
  title: "Why Async Rust?",
  url: "https://without.boats/blog/why-async-rust/",
  normalizedUrl: "without.boats/blog/why-async-rust",
  description: "Deep dive into async Rust design",
  domain: "without.boats",
  faviconUrl: null,
  imageUrl: null,
  resourceType: "article",
  tags: ["rust", "async"],
  searchText: "why async rust",
  createdAt: "2026-03-15T10:00:00Z",
  updatedAt: "2026-03-15T10:00:00Z",
};

const bm2: Bookmark = {
  id: "bm-2",
  userId: "u1",
  collectionId: "col-1",
  title: "Tokio Tutorial",
  url: "https://tokio.rs/tokio/tutorial",
  normalizedUrl: "tokio.rs/tokio/tutorial",
  description: null,
  domain: "tokio.rs",
  faviconUrl: null,
  imageUrl: null,
  resourceType: "documentation",
  tags: ["rust", "tokio"],
  searchText: "tokio tutorial",
  createdAt: "2026-03-16T10:00:00Z",
  updatedAt: "2026-03-16T10:00:00Z",
};

const bm3: Bookmark = {
  ...bm2,
  id: "bm-3",
  collectionId: "col-2",
  title: "React Docs",
  tags: ["react"],
};

// ─── formatDate ───────────────────────────────────────────────────────────────

describe("formatDate", () => {
  it("formats ISO string to YYYY-MM-DD", () => {
    expect(formatDate("2026-03-15T10:00:00Z")).toBe("2026-03-15");
  });

  it("zero-pads single-digit month and day", () => {
    expect(formatDate("2026-01-05T00:00:00Z")).toBe("2026-01-05");
  });
});

// ─── slugify ──────────────────────────────────────────────────────────────────

describe("slugify", () => {
  it("lowercases and replaces spaces with hyphens", () => {
    expect(slugify("Learning Rust")).toBe("learning-rust");
  });

  it("strips special characters", () => {
    expect(slugify("My Rust & WASM stuff!")).toBe("my-rust-wasm-stuff");
  });

  it("collapses multiple separators into one hyphen", () => {
    expect(slugify("a  --  b")).toBe("a-b");
  });

  it("trims leading and trailing hyphens", () => {
    expect(slugify("!hello world!")).toBe("hello-world");
  });
});

// ─── serializeCollectionJson ──────────────────────────────────────────────────

describe("serializeCollectionJson", () => {
  it("produces valid JSON", () => {
    expect(() => JSON.parse(serializeCollectionJson([bm1], col))).not.toThrow();
  });

  it("includes collection metadata", () => {
    const parsed = JSON.parse(serializeCollectionJson([bm1], col));
    expect(parsed.collection.name).toBe("Learning Rust");
    expect(parsed.collection.slug).toBe("learning-rust");
  });

  it("includes all bookmarks", () => {
    const parsed = JSON.parse(serializeCollectionJson([bm1, bm2], col));
    expect(parsed.bookmarks).toHaveLength(2);
  });

  it("maps bookmark fields correctly", () => {
    const parsed = JSON.parse(serializeCollectionJson([bm1], col));
    const b = parsed.bookmarks[0];
    expect(b.title).toBe("Why Async Rust?");
    expect(b.url).toBe("https://without.boats/blog/why-async-rust/");
    expect(b.tags).toEqual(["rust", "async"]);
    expect(b.resourceType).toBe("article");
    expect(b.savedAt).toBe("2026-03-15T10:00:00Z");
  });

  it("works with an empty bookmark list", () => {
    const parsed = JSON.parse(serializeCollectionJson([], col));
    expect(parsed.bookmarks).toHaveLength(0);
  });

  it("includes exportedAt timestamp", () => {
    const parsed = JSON.parse(serializeCollectionJson([bm1], col));
    expect(parsed.exportedAt).toBeTruthy();
  });
});

// ─── serializeAllJson ─────────────────────────────────────────────────────────

describe("serializeAllJson", () => {
  it("produces valid JSON", () => {
    expect(() => JSON.parse(serializeAllJson([bm1, bm3], [col, col2]))).not.toThrow();
  });

  it("resolves collection id to collection name", () => {
    const parsed = JSON.parse(serializeAllJson([bm1, bm3], [col, col2]));
    const rust = parsed.bookmarks.find((b: { title: string }) => b.title === "Why Async Rust?");
    const react = parsed.bookmarks.find((b: { title: string }) => b.title === "React Docs");
    expect(rust.collection).toBe("Learning Rust");
    expect(react.collection).toBe("Frontend");
  });

  it("falls back to id when collection is unknown", () => {
    const parsed = JSON.parse(serializeAllJson([bm1], []));
    expect(parsed.bookmarks[0].collection).toBe("col-1");
  });

  it("total count matches input", () => {
    const parsed = JSON.parse(serializeAllJson([bm1, bm2, bm3], [col, col2]));
    expect(parsed.bookmarks).toHaveLength(3);
  });
});

// ─── serializeCollectionMarkdown ──────────────────────────────────────────────

describe("serializeCollectionMarkdown", () => {
  it("starts with collection name as h1", () => {
    const md = serializeCollectionMarkdown([bm1], col);
    expect(md).toMatch(/^# Learning Rust/);
  });

  it("contains a markdown link for each bookmark", () => {
    const md = serializeCollectionMarkdown([bm1, bm2], col);
    expect(md).toContain("[Why Async Rust?](https://without.boats/blog/why-async-rust/)");
    expect(md).toContain("[Tokio Tutorial](https://tokio.rs/tokio/tutorial)");
  });

  it("includes description when present", () => {
    const md = serializeCollectionMarkdown([bm1], col);
    expect(md).toContain("Deep dive into async Rust design");
  });

  it("does not emit a blank description line when description is null", () => {
    const md = serializeCollectionMarkdown([bm2], col);
    const lines = md.split("\n");
    const titleIdx = lines.findIndex((l) => l.includes("[Tokio Tutorial]"));
    // next non-empty line after the title should be the meta line, not a spurious blank description
    const nextContent = lines.slice(titleIdx + 1).find((l) => l.trim() !== "");
    expect(nextContent).not.toBe("null");
    expect(nextContent).toMatch(/\*\*type:\*\*/);
  });

  it("formats tags in backticks", () => {
    const md = serializeCollectionMarkdown([bm1], col);
    expect(md).toContain("`rust`");
    expect(md).toContain("`async`");
  });

  it("includes the collection description when present", () => {
    const md = serializeCollectionMarkdown([bm1], col);
    expect(md).toContain("My Rust reading list");
  });
});

// ─── serializeAllMarkdown ─────────────────────────────────────────────────────

describe("serializeAllMarkdown", () => {
  it("groups bookmarks under their collection as h2", () => {
    const md = serializeAllMarkdown([bm1, bm3], [col, col2]);
    expect(md).toContain("## Learning Rust");
    expect(md).toContain("## Frontend");
  });

  it("each bookmark appears as a list item under its collection", () => {
    const md = serializeAllMarkdown([bm1, bm3], [col, col2]);
    expect(md).toContain("- [Why Async Rust?](https://without.boats/blog/why-async-rust/)");
    expect(md).toContain("- [React Docs](https://tokio.rs/tokio/tutorial)");
  });

  it("appends description inline when present", () => {
    const md = serializeAllMarkdown([bm1], [col]);
    expect(md).toContain("— Deep dive into async Rust design");
  });

  it("falls back to 'Uncategorised' for unknown collection", () => {
    const md = serializeAllMarkdown([bm1], []);
    expect(md).toContain("## Uncategorised");
  });

  it("starts with a top-level h1", () => {
    const md = serializeAllMarkdown([bm1], [col]);
    expect(md).toMatch(/^# DevLinks Export/);
  });
});
