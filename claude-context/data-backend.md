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
- Fields: `name`, `description`, `slug`, `is_public`
- `slug` unique
- Blank names rejected

### `bookmarks`

- PK: `id`
- FK: `user_id -> profiles.id`
- FK: `collection_id -> collections.id` with `on delete restrict`
- Stores title/url/description/domain/media/type/tags
- `normalized_url` and `search_text` are derived
- Unique constraint: `(user_id, normalized_url)`

## Derived-field behavior

From `supabase/migrations/20260413_000002_helpers_and_indexes.sql`:

- `normalize_bookmark_url(input_url)` strips scheme, `www`, query/hash, and trailing slashes
- `build_bookmark_search_text(...)` concatenates searchable fields into lowercase text
- `sync_bookmark_derived_fields()` trigger recomputes `normalized_url` and `search_text` on insert/update
- `set_updated_at()` trigger maintains `updated_at`

Client duplicate detection mirrors DB normalization in:

- `src/features/bookmarks/bookmarksApi.ts`
- function: `canonicalizeUrl()`

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

`src/server/taggingRules.ts` infers:

- resource type from hostname/path/title/description
- topic tags from regex rules over hostname/path/title/description

This is rule-based, not AI-generated.

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
