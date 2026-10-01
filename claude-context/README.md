# Claude Context Pack

Read this folder before scanning the repo. It is meant to keep context small.

## Current project state

- App: `DevLinks`
- Stack: Vite + React 18 + TypeScript + Redux Toolkit/RTK Query + Supabase; styling is CSS custom-property tokens in `src/styles.css` (Tailwind kept only for small utilities)
- Implemented backlog status: tasks `1-34` and post-MVP tasks `37-40` (redesign, public feed, roadmaps, page-declared tags) are done; see `tasks.md`
- Not done yet: task `35` (deploy/production verification) and task `36` (final QA/security pass)
- Seeded demo/public collections already exist for:
  - `react-debugging`
  - `css-layout`
  - `api-auth`

## What to ignore unless explicitly needed

- `dist/`
- `node_modules/`
- `playwright-report/`
- `test-results/`

## Read order

1. Root `README.md` for the human-facing product overview
2. `status-and-scope.md`
3. `architecture-map.md`
4. Read only one targeted file from `task-routing.md`
5. Use `data-backend.md` only if the task touches Supabase, metadata, tagging, search, or seeding

## Source of truth

- Routes and app shell: `src/app/`, `src/routes/`, `src/components/`
- Client data layer: `src/features/**` and `src/api/baseApi.ts`
- Shared types/env/helpers: `src/lib/`
- Metadata endpoint logic: `src/server/metadata.ts` and `api/metadata.ts` (tag extraction in `src/server/pageTags.ts`)
- Design tokens and primitives: `src/styles.css`, `src/components/ui/`
- Database shape and policies: `supabase/migrations/*.sql`
- Demo seed: `src/seed/demoData.ts`, `scripts/seed-demo.ts`, `supabase/seed.sql`
