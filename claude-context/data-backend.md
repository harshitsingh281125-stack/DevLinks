# Data And Backend

## Core types

Defined in `src/lib/types.ts`.

- `Profile`
- `Collection`
- `Bookmark`
- `MetadataPreview`
- `ResourceType`
- `SearchFilters`

Known resource types:

- `article`
- `video`
- `repo`
- `documentation`
- `tool`
- `course`
- `podcast`
- `other`

## Database tables

### `profiles`

- PK: `id` references `auth.users.id`
- Stores email, GitHub username, display name, avatar
- `updated_at` maintained by trigger

### `collections`

- PK: `id`
- FK: `user_id -> profiles.id`
- Fields: `name`, `description`, `slug`, `is_public`, `is_roadmap`
- `is_roadmap` (default false): show bookmarks as ordered, numbered steps
- `slug` unique
- Blank names rejected

### `bookmarks`

- PK: `id`
- FK: `user_id -> profiles.id`
- FK: `collection_id -> collections.id` with `on delete restrict`
- Stores title/url/description/domain/media/type/tags
- `normalized_url` and `search_text` are derived
- `position` (int, not null): 1-based order within the collection; backfilled oldest-first, appended by trigger on insert and on collection move
- Unique constraint: `(user_id, normalized_url)`
- Index: `(collection_id, position)`

## Derived-field behavior

From `supabase/migrations/20260413_000002_helpers_and_indexes.sql`:

- `normalize_bookmark_url(input_url)` strips scheme, `www`, query/hash, and trailing slashes
- `build_bookmark_search_text(...)` concatenates searchable fields into lowercase text
- `sync_bookmark_derived_fields()` trigger recomputes `normalized_url` and `search_text` on insert/update
- `set_updated_at()` trigger maintains `updated_at`

From `supabase/migrations/20260930_000001_roadmap_order.sql`:

- `assign_bookmark_position()` trigger appends new bookmarks, and bookmarks moved to another collection, at `max(position) + 1`
- `reorder_bookmarks(p_collection_id, p_bookmark_ids uuid[])` rewrites a collection's order in one statement. `security invoker` (RLS still applies); raises `22023` unless the id list is exactly the caller's bookmarks in that collection. Granted to `authenticated` only. Called from `reorderBookmarks` in `bookmarksApi.ts` via `supabase.rpc`
- Verified against real Postgres 16 (backfill, append, move, reorder, stale/foreign/cross-user rejection, anon denied, idempotent re-run)

Client duplicate detection mirrors DB normalization in:

- `src/features/bookmarks/canonicalUrl.ts` (re-exported from `bookmarksApi.ts`; kept API-free so the landing page demo can import it)
- function: `canonicalizeUrl()`
- Known gap: stripping the query string makes every `youtube.com/watch?v=…` collapse to `youtube.com/watch`

## Search

- UI state lives in URL params through `src/features/bookmarks/useSearchFilters.ts`
- Bookmark querying happens in `src/features/bookmarks/bookmarksApi.ts`
- Filters:
  - `q`
  - `cid`
  - `tag`
  - `type`
- Search covers title, URL, normalized URL, description, domain, tags, and resource type via `search_text`

## RLS/public-read model

From `supabase/migrations/20260413_000003_rls_policies.sql`:

- Users can fully manage only their own `profiles`, `collections`, and `bookmarks`
- `collections` are readable to anon/auth users when `is_public = true`
- `bookmarks` are readable to anon/auth users only when their parent collection is public
- Public API queries use the normal client and depend on RLS, not a privileged backend

## Metadata endpoint

Primary files:

- `api/metadata.ts`
- `src/server/metadata.ts`
- `src/server/html.ts` (quote-aware `<meta>` parsing, entity decoding, JSON-LD)
- `src/server/pageTags.ts` (publisher tags)
- `src/server/taggingRules.ts`

Behavior:

- Accepts `POST /api/metadata` with `{ url }`
- Validates absolute `http/https` URLs only
- Blocks localhost, `.local`, `.internal`, and private IP targets
- Follows redirects up to 5 hops
- Times out after 8s
- Extracts title, description, image, favicon
- Computes:
  - `normalizedUrl`
  - `resourceType`
  - `suggestedTags`
  - `fetchStatus`

Possible `fetchStatus` values:

- `success`
- `partial`
- `invalid_url`
- `blocked`
- `timeout`
- `error`

## Deterministic tagging

`suggestedTags = mergeSuggestedTags(extractPublisherTags(html, host), inferSuggestedTags(...))`, capped at 8.

1. `src/server/pageTags.ts` reads the tags the page declares, in trust order (max 6):
   `article:tag` meta → JSON-LD `keywords` (walks `@graph`) → Forem/dev.to "Tagged with …" in the description → GitHub `/topics/` links (github.com only) → `rel="tag"` links (only if nothing earlier matched; sidebars leak them) → `<meta keywords>`/`news_keywords` (low trust: boilerplate filtered, ≤ 2 words, max 5).
   `normalizeTag()` maps everything to one vocabulary via an alias table (`React.js`/`reactjs` → `react`, `golang` → `go`, `Developer Tools` → `devtools`, `C++` → `cpp`) and drops noise (`uncategorized`, numbers, long phrases).
2. `src/server/taggingRules.ts` infers resource type and adds keyword-rule tags from hostname/path/title/description (~130 rules incl. web platform, systems, AI, career). Some rules carry negative lookbehinds (e.g. "Flexbox algorithm" is not `algorithms`).

All rule-based, not AI-generated. Tests: `pageTags.test.ts` (fixtures mirror dev.to, Ghost, WordPress, GitHub markup) and `taggingRules.test.ts`.

## Seeding

Two seed paths exist:

- `supabase/seed.sql`
  - local/dev reset seed
  - inserts demo auth user, profile, collections, and bookmarks
- `scripts/seed-demo.ts`
  - live/admin seed
  - requires `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
  - idempotent upserts

Seed source of truth:

- `src/seed/demoData.ts`

Seeded public collections:

- `React Debugging`
- `CSS Layout`
- `API / Auth`
