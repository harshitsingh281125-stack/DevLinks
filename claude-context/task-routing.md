# Task Routing

Use this to avoid reading the whole repo.

## If the task is auth

Read:

- `src/features/auth/AuthBootstrap.tsx`
- `src/features/auth/useAuthActions.ts`
- `src/features/auth/profileBootstrap.ts`
- `src/features/auth/ProtectedRoute.tsx`
- `src/features/auth/config.ts`

## If the task is collections

Read:

- `src/features/collections/collectionsApi.ts`
- `src/features/collections/slugUtils.ts`
- `src/components/dashboard/CollectionsSidebar.tsx`
- `src/components/dashboard/CollectionSheet.tsx` — right-side drawer; controls open/close/mode
- `src/components/dashboard/CollectionEditor.tsx` — form inside the sheet
- `src/routes/DashboardPage.tsx`

## If the task is bookmark save/edit/delete

Read:

- `src/features/bookmarks/bookmarksApi.ts`
- `src/features/bookmarks/metadataApi.ts`
- `src/components/dashboard/UrlSaveEntry.tsx`
- `src/components/dashboard/SaveBookmarkModal.tsx`
- `src/components/dashboard/EditBookmarkModal.tsx`
- `src/components/dashboard/DeleteBookmarkDialog.tsx`
- `src/routes/DashboardPage.tsx`

## If the task is search/filter behavior

Read:

- `src/features/bookmarks/useSearchFilters.ts`
- `src/features/bookmarks/searchUtils.ts`
- `src/features/bookmarks/bookmarksApi.ts`
- `src/routes/DashboardPage.tsx`

## If the task is public pages or the explore feed

Read:

- `src/features/public/publicApi.ts` (`getPublicFeed` + pure `mapFeedRow`)
- `src/routes/PublicCollectionPage.tsx`
- `src/routes/ExplorePage.tsx` (`/explore`, search + sort in the URL)
- `src/components/public/CollectionFeed.tsx` (also used on the landing page)
- `src/components/public/PublicBookmarkCard.tsx`
- `src/components/public/RoadmapPath.tsx` (roadmap reader view)
- `src/lib/seo.ts`
- `src/lib/useDocumentHead.ts`

## If the task is metadata fetching or tagging

Read:

- `api/metadata.ts`
- `src/server/metadata.ts`
- `src/server/html.ts`
- `src/server/pageTags.ts` — page-declared tags, normalization, merge
- `src/server/taggingRules.ts`
- `src/features/bookmarks/metadataApi.ts`

## If the task is roadmaps (ordered collections)

Read:

- `supabase/migrations/20260930_000001_roadmap_order.sql`
- `src/lib/roadmap.ts` (`sortByPosition`, `moveItem`)
- `src/components/dashboard/RoadmapEditor.tsx` (author: drag / keyboard / buttons)
- `src/features/bookmarks/bookmarksApi.ts` (`reorderBookmarks`)
- `src/components/dashboard/CollectionEditor.tsx` (Roadmap switch)
- `src/components/public/RoadmapPath.tsx` (reader progress in localStorage)

## If the task is visual design or theming

Read:

- `src/styles.css` (tokens for both themes, primitives, design rules in the header comment)
- `src/styles/app.css`, `src/styles/marketing.css`
- `src/components/ui/` (`Dialog`/`Sheet`, `Logo`, `Favicon`, `ThemeSwitch`)
- `src/lib/theme.ts`

## If the task is Supabase schema/RLS/search/indexes

Read:

- `supabase/migrations/20260413_000001_initial_schema.sql`
- `supabase/migrations/20260413_000002_helpers_and_indexes.sql`
- `supabase/migrations/20260413_000003_rls_policies.sql`
- `supabase/migrations/20260930_000001_roadmap_order.sql`

## If the task is demo data or launch content

Read:

- `src/seed/demoData.ts`
- `supabase/seed.sql`
- `scripts/seed-demo.ts`

## If the task is export (JSON / Markdown download)

Read:

- `src/lib/export.ts`
- `src/features/bookmarks/bookmarksApi.ts` (see `getAllBookmarks` endpoint)
- `src/routes/DashboardPage.tsx` (see `ExportMenu` component and wiring)

## If the task is user profile (edit, avatar, public author display)

Read:

- `src/features/profile/profileApi.ts` — `useGetMyProfileQuery`, `useUpdateMyProfileMutation`, `useUploadAvatarMutation`; avatars go to Supabase Storage bucket `avatars`
- `src/routes/ProfilePage.tsx` — `/profile` route, form + avatar upload, dispatches `profileSyncSucceeded` on save
- `src/features/auth/profileBootstrap.ts` — `syncProfile` (login upsert, only touches 5 OAuth fields), `mapProfileRow`
- `src/features/auth/authSlice.ts` — `selectCurrentProfile`, `profileSyncSucceeded`
- `supabase/migrations/20260503_000001_profile_fields_and_storage.sql` — adds bio/location/website_url/twitter_handle/linkedin_url columns; avatars bucket + RLS; `profiles_select_public_author` RLS policy
- `src/features/public/publicApi.ts` — `getPublicCollectionBySlug` joins profiles for author display

## If the task is static/marketing pages (About, Privacy)

Read:

- `src/components/site/SiteLayout.tsx` (shared header/footer)
- `src/routes/AboutPage.tsx`
- `src/routes/PrivacyPage.tsx`
- `src/app/router.tsx`

## If the task is layout or navigation

Read:

- `src/components/layout/AppShell.tsx` — sidebar (collections, Explore, user menu), topbar search, mobile drawer
- `src/components/dashboard/CollectionsSidebar.tsx` — sidebar nav; pencil icon per row triggers edit sheet
- `src/components/dashboard/CollectionSheet.tsx` — on-demand right-side drawer for create/edit
- `src/app/router.tsx`
- `src/routes/HomePage.tsx`
- `src/routes/DashboardPage.tsx`

## If the task is analytics

Read:

- `src/lib/analytics.ts`
- `src/routes/DashboardPage.tsx`
- `src/routes/PublicCollectionPage.tsx`
- `src/features/auth/AuthBootstrap.tsx`

## If the task is env/setup

Read:

- `.env.example`
- `src/lib/env.ts`
- `src/lib/supabase.ts`
- `package.json`
