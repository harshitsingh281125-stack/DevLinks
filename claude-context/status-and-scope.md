# Status And Scope

## Product

`DevLinks` is a developer bookmark manager with:

- GitHub OAuth sign-in via Supabase
- Private collections for saved links
- Metadata preview before save
- Duplicate detection on normalized URL per user
- Search by text, tag, collection, and resource type
- Public collection pages at `/public/collections/:slug`

## Stable product rules

- One bookmark belongs to exactly one collection in v1
- Duplicate prevention is enforced by unique `(user_id, normalized_url)`
- Public access is collection-level, controlled by `collections.is_public`
- Public pages must never expose private collections or bookmarks
- Metadata/tagging runs through one server endpoint: `POST /api/metadata`

## Implemented routes

- `/` landing page
- `/app` authenticated dashboard
- `/public/collections/:slug` public read-only page
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

## Not finished yet

- Deployment + production auth/public-route verification
- Full MVP QA/security pass

## Important repo note

The root `README.md` is the human-facing product/project overview.
For implementation details and code edits, treat source files plus this `claude-context/` folder as the technical source of truth.
