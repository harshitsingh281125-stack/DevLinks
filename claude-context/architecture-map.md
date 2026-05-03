# Architecture Map

## Frontend shape

- `src/main.tsx`: bootstraps the app
- `src/app/App.tsx`: top-level app composition
- `src/app/providers.tsx`: Redux/provider wiring
- `src/app/router.tsx`: route table
- `src/app/store.ts`: Redux store with `baseApi`, `app`, and `auth`

## Route ownership

- `src/routes/HomePage.tsx`: landing page and GitHub sign-in CTA
- `src/routes/DashboardPage.tsx`: authenticated workspace
- `src/routes/PublicCollectionPage.tsx`: public shared collection page
- `src/routes/AboutPage.tsx`: "why I built this" static page
- `src/routes/PrivacyPage.tsx`: privacy policy static page
- `src/features/auth/ProtectedRoute.tsx`: redirect unauthenticated users to `/?redirectTo=...`

## Main feature slices

- `src/features/auth/`
  - session bootstrap
  - profile sync
  - auth actions/config
- `src/features/collections/`
  - collection CRUD
  - slug helpers
- `src/features/bookmarks/`
  - bookmark CRUD
  - metadata request client
  - search query normalization
  - URL search-param sync
- `src/features/public/`
  - unauthenticated reads for public collections/bookmarks

## UI/component ownership

- `src/components/layout/RootLayout.tsx`: outer layout
- `src/components/layout/AppShell.tsx`: dashboard shell, sidebar, mobile drawer
- `src/components/dashboard/`
  - `CollectionSheet.tsx`: right-side drawer that wraps CollectionEditor; opened on demand (sidebar `+`, per-row pencil, header button) — never mounted permanently
  - `CollectionEditor.tsx`: form inside the sheet — create/edit mode, duplicate-name warning, optimistic public/private toggle
  - `CollectionsSidebar.tsx`: collections list; each row has a persistent edit (pencil) button
  - URL entry, save/edit/delete bookmark modals, bookmark list/cards
- `src/components/public/`
  - public bookmark card rendering

## Shared utilities

- `src/lib/types.ts`: domain types and metadata/search contracts
- `src/lib/env.ts`: env loading
- `src/lib/supabase.ts`: browser Supabase client
- `src/lib/analytics.ts`: typed analytics events
- `src/lib/seo.ts`: public-page SEO/meta builders
- `src/lib/useDocumentHead.ts`: head-tag updates
- `src/lib/useFocusTrap.ts`: mobile drawer/modal accessibility helper
- `src/lib/export.ts`: bookmark export — pure serialisers (`serializeCollectionJson`, `serializeAllJson`, `serializeCollectionMarkdown`, `serializeAllMarkdown`) + browser download triggers (`exportCollectionJson`, `exportAllJson`, `exportCollectionMarkdown`, `exportAllMarkdown`). Tested in `src/lib/export.test.ts`.

## Backend/server shape

- `api/metadata.ts`: Vercel/serverless entry point
- `src/server/metadata.ts`: metadata fetch/parse/validate logic
- `src/server/taggingRules.ts`: deterministic resource-type and tag inference

## Database

- `supabase/migrations/20260413_000001_initial_schema.sql`: tables/constraints
- `supabase/migrations/20260413_000002_helpers_and_indexes.sql`: triggers, URL normalization, search text, indexes
- `supabase/migrations/20260413_000003_rls_policies.sql`: RLS and public-read rules

## Seed/demo data

- `src/seed/demoData.ts`: seed source of truth
- `supabase/seed.sql`: local reset seed
- `scripts/seed-demo.ts`: idempotent admin seed for a live Supabase project
