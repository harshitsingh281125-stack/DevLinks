# DevLinks

DevLinks is a developer-focused bookmark manager for saving, organizing, searching, and sharing technical resources.

It is built for the common developer workflow of collecting docs, repos, articles, videos, tools, and tutorials, then finding them later without relying on browser bookmarks alone.

## What it does

- Sign in with GitHub via Supabase Auth
- Create private collections for different topics
- Paste a URL and fetch preview metadata before saving
- Auto-suggest resource type and topic tags
- Prevent duplicate saves with normalized URL matching per user
- Search bookmarks by text, tag, collection, and resource type
- Publish selected collections as public read-only share pages

## Core product flows

### 1. Save a link

From the dashboard, paste a URL and DevLinks will:

- validate the URL
- fetch page metadata through `POST /api/metadata`
- extract title, description, favicon, image, and domain
- infer `resource_type`
- infer suggested tags

The user can then review and edit the bookmark before saving it.

### 2. Organize bookmarks

Bookmarks belong to one collection in v1. Collections are private by default and support create, edit, delete, and public/private toggle flows.

### 3. Find saved resources later

Bookmarks can be filtered by:

- search query
- collection
- tag
- resource type

Search/filter state is synced into the URL so back/forward navigation works cleanly.

### 4. Share public collections

Any collection can be published to a public route:

- `/public/collections/:slug`

Only collections marked `is_public = true` and their linked bookmarks are visible on public pages.

## Current status

This project has completed backlog tasks `1-34` from [tasks.md](./tasks.md).

Implemented:

- frontend app shell and landing page
- Supabase auth/session bootstrap
- profile sync after first sign-in
- collection CRUD
- bookmark CRUD
- metadata preview endpoint
- deterministic tagging/resource classification
- duplicate detection
- full-text search and filters
- public collection pages
- SEO helpers for public pages
- analytics events
- demo seed data for 3 launch-ready public collections

Not completed yet:

- production deployment verification
- final MVP QA/security pass

## Demo public collections

The seed data includes three public collections:

- `react-debugging`
- `css-layout`
- `api-auth`

## Tech stack

- Vite
- React 18
- TypeScript
- Tailwind CSS
- Redux Toolkit + RTK Query
- Supabase Auth + Database + RLS
- Vercel serverless function for metadata fetch
- Vitest and Playwright

## Project structure

```text
api/                  Serverless endpoint entrypoints
claude-context/       Token-efficient project context docs
scripts/              Utility scripts, including live seed script
src/app/              App bootstrap, router, store, providers
src/components/       Layout, dashboard, and public UI components
src/features/         Feature slices: auth, bookmarks, collections, public
src/lib/              Shared types, env, analytics, SEO, utilities
src/routes/           Route-level pages
src/server/           Metadata fetch/parsing and tagging rules
src/seed/             Seed data source of truth
supabase/migrations/  Schema, helpers, indexes, and RLS
supabase/seed.sql     Local/demo seed
tests/                Playwright tests
```

## Local setup

### Prerequisites

- Node.js 18+
- npm
- a Supabase project

### Install

```bash
npm install
```

### Environment variables

Create a local `.env` based on `.env.example`.

Required frontend env vars:

```env
VITE_APP_URL=http://localhost:5173
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_project_key
```

### Run the app

```bash
npm run dev
```

## Supabase notes

Database migrations live in:

- `supabase/migrations/20260413_000001_initial_schema.sql`
- `supabase/migrations/20260413_000002_helpers_and_indexes.sql`
- `supabase/migrations/20260413_000003_rls_policies.sql`

Important data rules:

- bookmarks are unique per user on `(user_id, normalized_url)`
- bookmark `normalized_url` and `search_text` are derived by DB trigger
- RLS protects private user data
- public reads are allowed only for public collections and their bookmarks

## Metadata endpoint

The app exposes one server-side endpoint:

- `POST /api/metadata`

It is responsible for:

- URL validation
- redirect handling
- timeout handling
- blocking localhost/private-network targets
- metadata extraction
- deterministic tag and resource-type inference

Main implementation files:

- `api/metadata.ts`
- `src/server/metadata.ts`
- `src/server/taggingRules.ts`

## Seed data

Local/demo seed:

- `supabase/seed.sql`

Live/admin seed script:

- `scripts/seed-demo.ts`

The source of truth for seeded collections/bookmarks is:

- `src/seed/demoData.ts`

## Available scripts

```bash
npm run dev
npm run build
npm run lint
npm run test:unit
npm run test:e2e
npm run check
npm run seed
```

## For Contributors

- Read this `README.md` first for the product overview
- Read [claude-context/README.md](./claude-context/README.md) for token-efficient codebase guidance
- Use [tasks.md](./tasks.md) for the original linear backlog and acceptance scope
