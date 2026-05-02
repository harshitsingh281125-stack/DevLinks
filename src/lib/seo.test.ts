import { describe, it, expect } from "vitest";
import {
  buildPublicCollectionMeta,
  truncateDescription,
  DEFAULT_TITLE,
  DEFAULT_DESCRIPTION,
  MAX_DESCRIPTION_LENGTH,
  SITE_NAME,
} from "./seo";

// ─── truncateDescription ───────────────────────────────────────────────────────

describe("truncateDescription", () => {
  it("returns the original string when it is within the limit", () => {
    const short = "Short description.";
    expect(truncateDescription(short)).toBe(short);
  });

  it("returns the original string when it is exactly at the limit", () => {
    const exact = "x".repeat(MAX_DESCRIPTION_LENGTH);
    expect(truncateDescription(exact)).toBe(exact);
  });

  it("truncates and appends an ellipsis when over the limit", () => {
    const long = "a".repeat(MAX_DESCRIPTION_LENGTH + 10);
    const result = truncateDescription(long);
    expect(result.length).toBe(MAX_DESCRIPTION_LENGTH);
    expect(result.endsWith("\u2026")).toBe(true);
  });

  it("trims trailing whitespace before appending the ellipsis", () => {
    // Build a string that has a space right at position max-1 (so it would be
    // included in the slice) to ensure the trim fires.
    const base = "a".repeat(MAX_DESCRIPTION_LENGTH - 2) + "  extra";
    const result = truncateDescription(base);
    expect(result.endsWith(" \u2026")).toBe(false);
    expect(result.endsWith("\u2026")).toBe(true);
  });

  it("respects a custom max length", () => {
    const result = truncateDescription("Hello World!", 5);
    expect(result).toBe("Hell\u2026");
    expect(result.length).toBe(5);
  });

  it("returns the string unchanged when max equals string length", () => {
    expect(truncateDescription("abc", 3)).toBe("abc");
  });
});

// ─── buildPublicCollectionMeta — null (loading / not-found) ───────────────────

describe("buildPublicCollectionMeta with null collection", () => {
  const meta = buildPublicCollectionMeta(null);

  it("sets title to the default DevLinks title", () => {
    expect(meta.title).toBe(DEFAULT_TITLE);
  });

  it("sets description to the default DevLinks description", () => {
    expect(meta.description).toBe(DEFAULT_DESCRIPTION);
  });

  it("mirrors ogTitle from title", () => {
    expect(meta.ogTitle).toBe(meta.title);
  });

  it("mirrors ogDescription from description", () => {
    expect(meta.ogDescription).toBe(meta.description);
  });

  it("sets ogType to 'website'", () => {
    expect(meta.ogType).toBe("website");
  });

  it("sets ogSiteName to SITE_NAME", () => {
    expect(meta.ogSiteName).toBe(SITE_NAME);
  });

  it("sets twitterCard to 'summary'", () => {
    expect(meta.twitterCard).toBe("summary");
  });

  it("mirrors twitterTitle from title", () => {
    expect(meta.twitterTitle).toBe(meta.title);
  });

  it("mirrors twitterDescription from description", () => {
    expect(meta.twitterDescription).toBe(meta.description);
  });

  it("sets canonical to the base URL", () => {
    expect(meta.canonical).toBe("https://devlinks.app");
  });

  it("uses a custom base URL when provided", () => {
    const m = buildPublicCollectionMeta(null, "https://example.com");
    expect(meta.ogUrl).toBe("https://devlinks.app");
    expect(m.ogUrl).toBe("https://example.com");
    expect(m.canonical).toBe("https://example.com");
  });
});

// ─── buildPublicCollectionMeta — full collection ──────────────────────────────

describe("buildPublicCollectionMeta with a full collection", () => {
  const collection = {
    name: "React Debugging",
    description: "Useful links for debugging React applications.",
    slug: "react-debugging",
  };

  const meta = buildPublicCollectionMeta(collection);

  it("formats title as '{name} — DevLinks'", () => {
    expect(meta.title).toBe("React Debugging \u2014 DevLinks");
  });

  it("uses the collection description", () => {
    expect(meta.description).toBe(collection.description);
  });

  it("mirrors ogTitle from title", () => {
    expect(meta.ogTitle).toBe(meta.title);
  });

  it("mirrors ogDescription from description", () => {
    expect(meta.ogDescription).toBe(meta.description);
  });

  it("sets ogType to 'website'", () => {
    expect(meta.ogType).toBe("website");
  });

  it("sets ogUrl to the full canonical collection URL", () => {
    expect(meta.ogUrl).toBe(
      "https://devlinks.app/public/collections/react-debugging",
    );
  });

  it("sets canonical equal to ogUrl", () => {
    expect(meta.canonical).toBe(meta.ogUrl);
  });

  it("sets ogSiteName to SITE_NAME", () => {
    expect(meta.ogSiteName).toBe(SITE_NAME);
  });

  it("sets twitterCard to 'summary'", () => {
    expect(meta.twitterCard).toBe("summary");
  });

  it("mirrors twitterTitle from title", () => {
    expect(meta.twitterTitle).toBe(meta.title);
  });

  it("mirrors twitterDescription from description", () => {
    expect(meta.twitterDescription).toBe(meta.description);
  });

  it("uses a custom base URL in the canonical and ogUrl", () => {
    const m = buildPublicCollectionMeta(collection, "https://staging.devlinks.app");
    expect(m.canonical).toBe(
      "https://staging.devlinks.app/public/collections/react-debugging",
    );
    expect(m.ogUrl).toBe(m.canonical);
  });
});

// ─── buildPublicCollectionMeta — null description (fallback) ─────────────────

describe("buildPublicCollectionMeta — null description fallback", () => {
  const collection = {
    name: "CSS Layout",
    description: null,
    slug: "css-layout",
  };

  const meta = buildPublicCollectionMeta(collection);

  it("uses the generated fallback description", () => {
    expect(meta.description).toBe(
      `A curated public collection shared via ${SITE_NAME}.`,
    );
  });

  it("still uses the collection name in the title", () => {
    expect(meta.title).toContain("CSS Layout");
  });
});

// ─── buildPublicCollectionMeta — empty-string description (fallback) ─────────

describe("buildPublicCollectionMeta — empty string description fallback", () => {
  const meta = buildPublicCollectionMeta({
    name: "API Auth",
    description: "   ",  // whitespace-only → treated as absent
    slug: "api-auth",
  });

  it("falls back when description is whitespace-only", () => {
    expect(meta.description).toBe(
      `A curated public collection shared via ${SITE_NAME}.`,
    );
  });
});

// ─── buildPublicCollectionMeta — long description truncation ─────────────────

describe("buildPublicCollectionMeta — long description", () => {
  const longDesc = "A ".repeat(100).trim(); // 199 chars
  const collection = {
    name: "Long Collection",
    description: longDesc,
    slug: "long-collection",
  };

  const meta = buildPublicCollectionMeta(collection);

  it("truncates description to MAX_DESCRIPTION_LENGTH characters", () => {
    expect(meta.description.length).toBe(MAX_DESCRIPTION_LENGTH);
  });

  it("ends with an ellipsis", () => {
    expect(meta.description.endsWith("\u2026")).toBe(true);
  });

  it("truncates ogDescription identically", () => {
    expect(meta.ogDescription).toBe(meta.description);
  });

  it("truncates twitterDescription identically", () => {
    expect(meta.twitterDescription).toBe(meta.description);
  });
});

// ─── buildPublicCollectionMeta — null slug ────────────────────────────────────

describe("buildPublicCollectionMeta — null slug", () => {
  const meta = buildPublicCollectionMeta({
    name: "No Slug Yet",
    description: null,
    slug: null,
  });

  it("builds canonical with an empty string in place of the slug", () => {
    expect(meta.canonical).toBe("https://devlinks.app/public/collections/");
  });
});

// ─── buildPublicCollectionMeta — collection with different names ──────────────

describe("buildPublicCollectionMeta — various collection names", () => {
  const cases = [
    { name: "React Debugging", slug: "react-debugging" },
    { name: "CSS Layout", slug: "css-layout" },
    { name: "API / Auth", slug: "api-auth" },
  ];

  for (const { name, slug } of cases) {
    it(`formats title correctly for '${name}'`, () => {
      const meta = buildPublicCollectionMeta({ name, description: null, slug });
      expect(meta.title).toBe(`${name} \u2014 ${SITE_NAME}`);
    });
  }
});
