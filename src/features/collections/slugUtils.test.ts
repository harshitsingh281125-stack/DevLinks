import { describe, expect, it } from "vitest";
import {
  generateCollectionSlug,
  getOrGenerateSlug,
  slugSuffix,
  slugifyName,
} from "./slugUtils";

// ─── slugifyName ──────────────────────────────────────────────────────────────

describe("slugifyName", () => {
  describe("basic lowercasing and hyphenation", () => {
    it("lowercases all characters", () => {
      expect(slugifyName("React Debugging")).toBe("react-debugging");
    });

    it("replaces spaces with hyphens", () => {
      expect(slugifyName("CSS Layout Grid")).toBe("css-layout-grid");
    });

    it("replaces multiple spaces with a single hyphen", () => {
      expect(slugifyName("API  Auth  Guide")).toBe("api-auth-guide");
    });

    it("replaces special characters with hyphens", () => {
      expect(slugifyName("React & TypeScript")).toBe("react-typescript");
    });

    it("collapses consecutive non-alphanumeric chars to one hyphen", () => {
      expect(slugifyName("A  ---  B")).toBe("a-b");
    });
  });

  describe("trimming", () => {
    it("trims leading hyphens", () => {
      expect(slugifyName("---react")).toBe("react");
    });

    it("trims trailing hyphens", () => {
      expect(slugifyName("react---")).toBe("react");
    });

    it("trims both leading and trailing hyphens", () => {
      expect(slugifyName("---react---")).toBe("react");
    });

    it("trims leading/trailing whitespace before slugifying", () => {
      expect(slugifyName("  React  ")).toBe("react");
    });
  });

  describe("length cap at 44 characters", () => {
    it("returns at most 44 characters", () => {
      const long = "a".repeat(100);
      expect(slugifyName(long).length).toBeLessThanOrEqual(44);
    });

    it("does not truncate a name shorter than 44 characters", () => {
      const name = "short-name";
      expect(slugifyName(name)).toBe(name);
    });

    it("truncates exactly at 44 characters when input is longer", () => {
      const name = "a".repeat(50);
      expect(slugifyName(name)).toHaveLength(44);
    });
  });

  describe("edge cases", () => {
    it("returns an empty string for an all-special-character name", () => {
      expect(slugifyName("---!!!---")).toBe("");
    });

    it("returns an empty string for an empty input", () => {
      expect(slugifyName("")).toBe("");
    });

    it("handles a single word unchanged", () => {
      expect(slugifyName("javascript")).toBe("javascript");
    });

    it("handles a name that is already a valid slug", () => {
      expect(slugifyName("react-debugging")).toBe("react-debugging");
    });

    it("handles numbers in the name", () => {
      expect(slugifyName("Web3 Tooling")).toBe("web3-tooling");
    });

    it("handles Unicode/non-ASCII by converting to hyphens", () => {
      expect(slugifyName("Résumé Tips")).toBe("r-sum-tips");
    });
  });
});

// ─── slugSuffix ───────────────────────────────────────────────────────────────

describe("slugSuffix", () => {
  it("returns the first 6 alphanumeric chars of the UUID", () => {
    expect(slugSuffix("a3f2b1c4-dead-beef-0123-456789abcdef")).toBe("a3f2b1");
  });

  it("strips hyphens before slicing", () => {
    // UUID: "00000000-1111-2222-..." → stripped "00000000111122..." → first 6 = "000000"
    expect(slugSuffix("00000000-1111-2222-3333-444444444444")).toBe("000000");
  });

  it("returns 6 chars even for a UUID with early hyphens", () => {
    const suffix = slugSuffix("abcd-ef01-2345-6789-abcdefabcdef");
    expect(suffix).toHaveLength(6);
  });

  it("always returns exactly 6 characters for a standard UUID", () => {
    const ids = [
      "550e8400-e29b-41d4-a716-446655440000",
      "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
      "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    ];
    for (const id of ids) {
      expect(slugSuffix(id)).toHaveLength(6);
    }
  });
});

// ─── generateCollectionSlug ───────────────────────────────────────────────────

describe("generateCollectionSlug", () => {
  it("produces {name-slug}-{id-suffix} format", () => {
    const slug = generateCollectionSlug("React Debugging", "a3f2b1c4-dead-beef-0000-000000000000");
    expect(slug).toBe("react-debugging-a3f2b1");
  });

  it("includes the 6-char id suffix", () => {
    const id = "550e8400-e29b-41d4-a716-446655440000";
    const slug = generateCollectionSlug("CSS Layout", id);
    expect(slug).toContain(slugSuffix(id));
  });

  it("falls back to just the suffix when the name slugifies to empty", () => {
    const id = "abcdef12-0000-0000-0000-000000000000";
    const slug = generateCollectionSlug("---!!!---", id);
    expect(slug).toBe(slugSuffix(id));
  });

  it("two collections with the same name but different IDs get different slugs", () => {
    const a = generateCollectionSlug("API Auth", "aaaa0000-0000-0000-0000-000000000000");
    const b = generateCollectionSlug("API Auth", "bbbb1111-0000-0000-0000-000000000000");
    expect(a).not.toBe(b);
  });

  it("same collection always produces the same slug (deterministic)", () => {
    const name = "TypeScript Deep Dive";
    const id = "deadbeef-1234-5678-9abc-def012345678";
    expect(generateCollectionSlug(name, id)).toBe(generateCollectionSlug(name, id));
  });

  it("slug contains only lowercase alphanumeric characters and hyphens", () => {
    const slug = generateCollectionSlug("React & TypeScript! Guide 2026", "f47ac10b-58cc-4372-a567-0e02b2c3d479");
    expect(slug).toMatch(/^[a-z0-9-]+$/);
  });

  it("slug does not start or end with a hyphen (except the separator before suffix)", () => {
    const slug = generateCollectionSlug("React Debugging", "a3f2b1c4-dead-beef-0000-000000000000");
    expect(slug.startsWith("-")).toBe(false);
    expect(slug.endsWith("-")).toBe(false);
  });

  it("handles a very long collection name without producing an excessively long slug", () => {
    const longName = "a".repeat(200);
    const id = "12345678-0000-0000-0000-000000000000";
    const slug = generateCollectionSlug(longName, id);
    // base is capped at 44, suffix is 6, separator is 1 → max 51
    expect(slug.length).toBeLessThanOrEqual(51);
  });
});

// ─── getOrGenerateSlug ────────────────────────────────────────────────────────

describe("getOrGenerateSlug", () => {
  it("returns the existing slug when one is already persisted", () => {
    const collection = {
      id: "a3f2b1c4-dead-beef-0000-000000000000",
      name: "React Debugging",
      slug: "my-custom-slug-a3f2b1",
    };
    expect(getOrGenerateSlug(collection)).toBe("my-custom-slug-a3f2b1");
  });

  it("generates a slug when slug is null", () => {
    const collection = {
      id: "a3f2b1c4-dead-beef-0000-000000000000",
      name: "React Debugging",
      slug: null,
    };
    expect(getOrGenerateSlug(collection)).toBe("react-debugging-a3f2b1");
  });

  it("preserves slug across private → public re-toggle (slug stays stable)", () => {
    const collection = {
      id: "a3f2b1c4-dead-beef-0000-000000000000",
      name: "React Debugging",
      slug: "react-debugging-a3f2b1",
    };
    // Simulate the collection being made private (slug is retained in DB)
    // then toggled public again — getOrGenerateSlug returns the same slug.
    expect(getOrGenerateSlug(collection)).toBe("react-debugging-a3f2b1");
  });

  it("generates a fresh slug when slug is null even if name changed", () => {
    const collection = {
      id: "a3f2b1c4-dead-beef-0000-000000000000",
      name: "Updated Name",
      slug: null,
    };
    // Should use the current name, not a stale one
    expect(getOrGenerateSlug(collection)).toBe("updated-name-a3f2b1");
  });

  it("generated slug is deterministic for the same collection", () => {
    const collection = {
      id: "deadbeef-1234-5678-9abc-def012345678",
      name: "CSS Grid Mastery",
      slug: null,
    };
    expect(getOrGenerateSlug(collection)).toBe(getOrGenerateSlug(collection));
  });
});
