# Status And Scope

## Product

`DevLinks` is a developer bookmark manager with:

- GitHub OAuth sign-in via Supabase
- Private collections for saved links
- Metadata preview before save
- Duplicate detection on normalized URL per user
- Search by text, tag, collection, and resource type
- Public collection pages at `/public/collections/:slug`
- A public collection feed (landing page + `/explore`)
- Roadmap collections: author-ordered steps with reader progress

## Stable product rules

- One bookmark belongs to exactly one collection in v1
- Duplicate prevention is enforced by unique `(user_id, normalized_url)`
- Public access is collection-level, controlled by `collections.is_public`
- Order is collection-level: `bookmarks.position`, rewritten only through `reorder_bookmarks` (full id list, rejects stale lists)
- Reader progress on roadmaps is client-only (`localStorage`), never stored server-side
- Public pages must never expose private collections or bookmarks
- Metadata/tagging runs through one server endpoint: `POST /api/metadata`

## Implemented routes

- `/` landing page
- `/app` authenticated dashboard
- `/profile` authenticated profile editor (optional, skippable)
- `/public/collections/:slug` public read-only page (numbered path for roadmaps)
- `/explore` — every public collection, search + sort synced to the URL
- `/about` — "why I built this" page with author card (GitHub link placeholder until repo is public)
- `/privacy` — privacy policy page (contact: harshit.singh281125@gmail.com)

## What is already finished

- Auth bootstrap, protected route flow, GitHub OAuth, sign-out
- Profile upsert/sync after first login — profile state is preserved on tab-switch token refresh (only reset on actual user change)
- Collection CRUD, including delete restriction for non-empty collections
- Metadata preview endpoint with URL validation, timeout, redirect handling, and SSRF-style private-network blocking
- Bookmark create/edit/delete
- Duplicate-save flow returns the existing bookmark instead of silently failing
- Search/filter URL sync
- Public collection toggle + slug persistence
- SEO metadata for public pages
- Analytics events for signup, first bookmark, search, public toggle, public page view
- Demo seed data for 3 launch-ready public collections
- Export feature: per-collection and all-bookmarks export to JSON and Markdown, accessible via the dashboard collection header
- `/about` and `/privacy` public pages
- Landing page cleanup: removed dead "See a live demo" CTAs, wired footer links to real routes (About → `/about`, Privacy → `/privacy`, Contact → `mailto:`, Product links → anchor sections), removed Terms/Status/Docs/API/GitHub/Changelog footer entries
- User profile: editable `/profile` page (display name, bio, location, website, GitHub, Twitter/X, LinkedIn, avatar upload to Supabase Storage `avatars` bucket); profile is optional and skippable; first-time banner on dashboard; profile link in sidebar user menu
- Public collection pages show full author card (avatar, name, bio, location, all social links) — sourced from the joined `profiles` row via RLS policy `profiles_select_public_author` (visible only when user has ≥1 public collection)
- UI redesign (2026-09-30): one token-based design system in `src/styles.css` (light + dark, Geist), shared `Dialog`/`Sheet`, rebuilt landing (live tagging-rules demo, honest copy), dashboard, public, profile, about, privacy, 404. Fixed along the way: stale-search-param race in `useSearchFilters`, new collection deselecting itself, invisible non-empty-delete error, invalid type filters, dead mobile search
- Public feed (2026-09-30): `getPublicFeed` + `CollectionFeed`, landing `#explore` section and `/explore`
- Roadmaps (2026-09-30): migration `20260930_000001_roadmap_order.sql` (applied to production 2026-10-01), `RoadmapEditor` (drag, arrow keys, buttons; batched optimistic save; cancelled drags snap back), `RoadmapPath` reader view
- Tag suggestions (2026-10-01): page-declared tags first (`src/server/pageTags.ts`), normalized vocabulary, ~45 new keyword rules; quote-aware meta parsing with entity decoding (`src/server/html.ts`)
- Tests: 647 unit (Vitest), 16 E2E (Playwright) against `tests/support/mockSupabase.ts`

## Not finished yet

- Deployment + production auth/public-route verification
- Full MVP QA/security pass
- Known gap: duplicate detection collapses every `youtube.com/watch?v=…` to one key (needs a `normalize_bookmark_url` migration)
- Native mouse drag-and-drop of roadmap steps is covered by replayed-event tests only; headless Chromium never emits `drop` for synthesized mouse drags

## Important repo note

The root `README.md` is the human-facing product/project overview.
For implementation details and code edits, treat source files plus this `claude-context/` folder as the technical source of truth.
