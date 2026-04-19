# DevLinks MVP Build Backlog

## Summary
Build `DevLinks` as a new standalone Vite React + TypeScript app with Supabase auth/database, one server-side metadata endpoint, and Vercel deployment. The implementation should follow a strict linear backlog so each task can be completed and verified before moving to the next.

## Ordered Tasks
1. Create the new repo/app scaffold with Vite, React, TypeScript, and a clean folder structure for `app`, `features`, `components`, `lib`, `routes`, and `api`.
2. Install and configure core dependencies: Tailwind, React Router, Redux Toolkit, RTK Query, Supabase client, form/validation utilities, and icon/UI primitives if needed.
3. Set up base app infrastructure: Tailwind theme tokens, global styles, routing shell, environment variable handling, and a minimal app layout.
4. Create the Supabase project and configure GitHub OAuth, redirect URLs, local env vars, and Vercel env var mapping.
5. Write the initial database schema for `profiles`, `collections`, and `bookmarks`, including primary keys, foreign keys, timestamps, and uniqueness constraints.
6. Add database helpers: `updated_at` trigger, `normalized_url` generation strategy, and `search_text` generation strategy.
7. Create indexes for fast lookup: `collections.slug`, `bookmarks(user_id, normalized_url)`, and full-text search index over `search_text`.
8. Implement Row Level Security policies for all user-owned tables so users can only read/write their own private data.
9. Implement the public-read path so only `is_public = true` collections and their linked bookmarks are readable without exposing private rows.
10. Define shared TypeScript domain types for `Profile`, `Collection`, `Bookmark`, `MetadataPreview`, `ResourceType`, and `SearchFilters`.
11. Configure the Supabase client layer and auth session bootstrap in the frontend.
12. Build the GitHub sign-in flow, session persistence, sign-out flow, and protected route guard.
13. Add profile bootstrap logic so a `profiles` row is created or synced after first successful login.
14. Build the landing page with product CTA and `Sign in with GitHub`.
15. Build the authenticated dashboard shell with collection sidebar, top search bar, main content region, and empty state.
16. Implement collection create/read/update/delete flows, including constraints around deleting non-empty collections.
17. Build the URL save entry point on the dashboard so a user can paste a link and trigger metadata preview.
18. Implement the server-side `POST /api/metadata` endpoint with URL validation, timeout, redirects handling, metadata extraction, and safe failure modes.
19. Implement deterministic tagging rules for `resource_type` and topic tags using domain, URL path, and title/description keyword matching.
20. Build the save/edit modal showing fetched title, description, domain, favicon/image, suggested tags, resource type, and collection selection.
21. Implement bookmark create flow with duplicate detection on `user_id + normalized_url` and a clear merge/edit path instead of silent failure.
22. Implement bookmark list rendering with optimistic refresh after create/update/delete.
23. Implement bookmark edit flow for title, tags, type, and collection reassignment.
24. Implement bookmark delete flow with confirmation and immediate UI update.
25. Implement search and filter state using RTK Query plus URL/state sync for `query`, `collectionId`, `tag`, and `resource_type`.
26. Wire full-text search so matches cover title, URL, description, tags, and normalized search text.
27. Build resource-type, collection, and tag filters with reset/clear behavior and empty-result states.
28. Implement collection public toggle and slug generation with uniqueness checks.
29. Build the public collection route at `/public/collections/:slug` with read-only rendering and no private controls.
30. Add SEO metadata for public collection pages and clean social preview fallback behavior.
31. Add loading, error, partial-fetch, duplicate, and unauthorized states across auth, metadata, bookmarks, and public pages.
32. Add responsive/mobile polish and keyboard-accessible interactions for forms, modals, filters, and list navigation.
33. Add analytics events for signup, first bookmark, search, public toggle, and public page view.
34. Seed demo data for 3 launch-ready public collections: `React Debugging`, `CSS Layout`, and `API/Auth`.
35. Deploy to Vercel, connect Supabase + env vars, and verify production auth redirects and public routes.
36. Run MVP QA and security checks against all acceptance criteria before launch.

## Public Interfaces / Contracts
- Frontend routes:
  - `/` landing page
  - `/app` authenticated dashboard
  - `/public/collections/:slug` public share page
- Server endpoint:
  - `POST /api/metadata` with input `{ url }`
  - Response includes preview metadata, `resource_type`, suggested `tags[]`, and `fetch_status`
- Core data model:
  - One bookmark belongs to one collection in v1
  - Duplicate prevention is enforced by unique `bookmarks(user_id, normalized_url)`
  - Only public collections are accessible via slug route

## Test Plan
- Auth: GitHub sign-in, session restore, sign-out, protected route redirect.
- RLS: User A cannot read or modify User B rows; public route cannot access private collections/bookmarks.
- Metadata: valid URL, invalid URL, timeout, partial metadata, blocked site, redirecting site.
- Bookmarks: create, duplicate save, edit, delete, collection reassignment, manual tag override.
- Search: query matches title, description, URL, and tags; filters combine correctly.
- Public sharing: toggle public on/off, slug uniqueness, public page shows only expected bookmarks.
- UX: empty states, loading states, mobile layout, keyboard navigation, and error recovery.

## Assumptions
- Standalone new app in an empty workspace, not integrated into an existing repo.
- React + TypeScript + Tailwind + Redux Toolkit/RTK Query remain fixed for v1.
- Supabase handles auth and primary CRUD; only metadata/tagging runs through a custom server-side endpoint.
- Slugs are generated identifiers, not fully user-custom editable slugs, to reduce collision and moderation risk.
- Bookmark import, browser extension, AI summaries, multi-collection membership, and collaboration stay out of MVP.
