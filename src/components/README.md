# Components

UI components, grouped by where they're used:

- `ui/` — shared primitives: `Dialog`/`Sheet` (focus trap, Escape, scroll lock), `Logo`, `Favicon`, `ThemeSwitch`, `BrandIcons`
- `site/` — marketing shell: `SiteLayout` (header/footer) and the single `SignInButton`
- `layout/` — `AppShell` for the dashboard (sidebar, topbar search, mobile drawer)
- `dashboard/` — bookmark cards and list, save/edit dialogs (`BookmarkFields`), collection sheet, `RoadmapEditor`
- `public/` — public collection rows, the `CollectionFeed`, and the `RoadmapPath` reader view

Styles live in `src/styles.css` (tokens) and `src/styles/` (app, marketing), not in components.
