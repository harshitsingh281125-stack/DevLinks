// ─── Slug utilities ───────────────────────────────────────────────────────────
// Slugs identify public collection pages at /public/collections/:slug.
// Per the v1 assumptions, slugs are generated identifiers — not fully
// user-editable — to reduce collision and moderation risk.
//
// Strategy: base slug from the collection name + 6-char suffix derived from the
// collection UUID.  Because UUID fragments are unique per collection, the
// resulting slug is globally unique by construction with no round-trip needed.

/**
 * Converts an arbitrary string into a URL-safe lowercase slug segment.
 * Leading/trailing hyphens are trimmed; runs of non-alphanumeric characters
 * are collapsed to a single hyphen.  Max length is capped at 44 characters so
 * the full slug (with suffix) stays under ~55 chars.
 */
export function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 44);
}

/**
 * Derives a 6-character alphanumeric suffix from a UUID.
 * Hyphens are stripped so we always get a dense 6-char string.
 */
export function slugSuffix(collectionId: string): string {
  return collectionId.replace(/-/g, "").slice(0, 6);
}

/**
 * Generates the canonical slug for a collection: "{name-slug}-{id-suffix}".
 * When the name produces an empty base (e.g. all special characters), the
 * suffix alone is returned so the slug is never empty.
 */
export function generateCollectionSlug(name: string, collectionId: string): string {
  const base = slugifyName(name);
  const suffix = slugSuffix(collectionId);
  return base ? `${base}-${suffix}` : suffix;
}

/**
 * Returns the collection's existing slug if one has already been persisted,
 * otherwise generates a fresh one.  This preserves slugs across public ↔
 * private toggles so the share URL never changes after first publication.
 */
export function getOrGenerateSlug(collection: {
  id: string;
  name: string;
  slug: string | null;
}): string {
  return collection.slug ?? generateCollectionSlug(collection.name, collection.id);
}
