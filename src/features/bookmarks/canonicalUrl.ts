// ─── URL canonicalization ─────────────────────────────────────────────────────
// Mirrors the Postgres `normalize_bookmark_url` function used by the DB trigger
// so the client and DB agree on the normalized form for duplicate detection.
// Kept free of API imports so the landing page can run it without Supabase.

export function canonicalizeUrl(url: string): string {
  return url
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/^www\d*\./, "")
    .replace(/[#?].*$/, "")
    .replace(/\/+$/, "");
}
