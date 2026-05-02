// ─── SEO / social-preview helpers ─────────────────────────────────────────────
// Pure functions — no DOM, no React — so they are fully unit-testable in Node.

export const SITE_NAME = "DevLinks";
export const DEFAULT_TITLE = "DevLinks — Developer Bookmark Manager";
export const DEFAULT_DESCRIPTION =
  "Save, organise, and share developer links with DevLinks.";

/** Maximum character length for description meta tags (industry standard). */
export const MAX_DESCRIPTION_LENGTH = 160;

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface CollectionMeta {
  /** <title> and og:title / twitter:title */
  title: string;
  /** <meta name="description"> */
  description: string;
  ogTitle: string;
  ogDescription: string;
  /** Always "website" for public collection pages */
  ogType: string;
  ogUrl: string;
  ogSiteName: string;
  twitterCard: string;
  twitterTitle: string;
  twitterDescription: string;
  /** <link rel="canonical"> href */
  canonical: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Truncates `text` to at most `max` characters, appending "…" when cut.
 * Trims trailing whitespace before appending so the ellipsis sits flush.
 */
export function truncateDescription(text: string, max: number = MAX_DESCRIPTION_LENGTH): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1).trimEnd() + "\u2026";
}

/**
 * Builds the full set of head-tag values for a public collection page.
 *
 * Pass `null` for `collection` to get the generic DevLinks site defaults
 * (used when data is still loading or the collection is not found).
 */
export function buildPublicCollectionMeta(
  collection: {
    name: string;
    description: string | null;
    slug: string | null;
  } | null,
  baseUrl: string = "https://devlinks.app",
): CollectionMeta {
  if (!collection) {
    return {
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
      ogTitle: DEFAULT_TITLE,
      ogDescription: DEFAULT_DESCRIPTION,
      ogType: "website",
      ogUrl: baseUrl,
      ogSiteName: SITE_NAME,
      twitterCard: "summary",
      twitterTitle: DEFAULT_TITLE,
      twitterDescription: DEFAULT_DESCRIPTION,
      canonical: baseUrl,
    };
  }

  const title = `${collection.name} \u2014 ${SITE_NAME}`;

  const rawDescription =
    collection.description?.trim() ||
    `A curated public collection shared via ${SITE_NAME}.`;
  const description = truncateDescription(rawDescription);

  const canonical = `${baseUrl}/public/collections/${collection.slug ?? ""}`;

  return {
    title,
    description,
    ogTitle: title,
    ogDescription: description,
    ogType: "website",
    ogUrl: canonical,
    ogSiteName: SITE_NAME,
    twitterCard: "summary",
    twitterTitle: title,
    twitterDescription: description,
    canonical,
  };
}
