import type { Bookmark } from "@/lib/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BookmarkSearchFields {
  title: string;
  url: string;
  normalizedUrl: string;
  description: string | null;
  domain: string | null;
  tags: string[];
}

// ─── buildSearchText ──────────────────────────────────────────────────────────
// Mirrors the Postgres trigger that populates the `search_text` column so
// client-side matching stays in sync with the DB index.
// Order: title · url · normalizedUrl · description · domain · tags (joined).

export function buildSearchText(fields: BookmarkSearchFields): string {
  return [
    fields.title,
    fields.url,
    fields.normalizedUrl,
    fields.description,
    fields.domain,
    ...fields.tags,
  ]
    .filter((v): v is string => v !== null && v !== undefined && v !== "")
    .join(" ")
    .toLowerCase();
}

// ─── tokenizeQuery ────────────────────────────────────────────────────────────
// Splits raw user input into lowercase tokens, deduplicates them, and removes
// empty entries.  Each token must appear in the haystack for a match.

export function tokenizeQuery(raw: string): string[] {
  const seen = new Set<string>();
  return raw
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 0)
    .filter((t) => {
      if (seen.has(t)) return false;
      seen.add(t);
      return true;
    });
}

// ─── matchesSearchQuery ───────────────────────────────────────────────────────
// Pure client-side predicate: returns true when every query token appears
// somewhere in the bookmark's searchable text (title, URL, normalizedUrl,
// description, domain, or tags).  Empty query always matches.
//
// Useful for optimistic filtering while the RTK Query network call is in-flight,
// and for unit-testing search correctness without hitting Supabase.

export function matchesSearchQuery(bookmark: Bookmark, rawQuery: string): boolean {
  const tokens = tokenizeQuery(rawQuery);
  if (tokens.length === 0) return true;

  const haystack = buildSearchText({
    title: bookmark.title,
    url: bookmark.url,
    normalizedUrl: bookmark.normalizedUrl,
    description: bookmark.description,
    domain: bookmark.domain,
    tags: bookmark.tags,
  });

  return tokens.every((token) => haystack.includes(token));
}

// ─── normalizeSearchQuery ─────────────────────────────────────────────────────
// Prepares a raw query string for Supabase's .textSearch() call:
//   • trims surrounding whitespace
//   • collapses internal runs of whitespace to a single space
//
// Postgres websearch_to_tsquery (used when type: 'websearch' is passed) handles
// the actual conversion to tsquery — no further escaping is needed here.

export function normalizeSearchQuery(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}
