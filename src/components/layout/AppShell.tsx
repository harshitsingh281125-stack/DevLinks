import { useCallback, useEffect, useRef, useState, type PropsWithChildren } from "react";
import {
  ArrowUpRight,
  ChevronRight,
  ChevronsUpDown,
  Compass,
  LogOut,
  Menu,
  Search,
  UserRound,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAppSelector } from "@/app/hooks";
import { CollectionsSidebar } from "@/components/dashboard/CollectionsSidebar";
import { Logo } from "@/components/ui/Logo";
import { ThemeSwitch } from "@/components/ui/ThemeSwitch";
import { selectCurrentProfile, selectCurrentUser } from "@/features/auth/authSlice";
import { useAuthActions } from "@/features/auth/useAuthActions";
import { useGetAllPublicCollectionsQuery } from "@/features/public/publicApi";
import type { Collection } from "@/lib/types";
import { useDismiss } from "@/lib/useDismiss";
import { useFocusTrap } from "@/lib/useFocusTrap";
import { cn } from "@/lib/utils";

const isApplePlatform =
  typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.userAgent);

// ─── Explore (public collections across DevLinks) ─────────────────────────────

function ExploreSection({ onNavigate }: { onNavigate: () => void }) {
  const { data: collections = [], isLoading, isError } = useGetAllPublicCollectionsQuery();

  return (
    <nav className="side-section" aria-label="Explore public collections">
      <div className="side-label">
        <span>Explore</span>
        <Link to="/explore" className="icon-btn icon-btn-sm" aria-label="Browse all public collections" title="Browse all" onClick={onNavigate}>
          <Compass size={14} strokeWidth={1.75} />
        </Link>
      </div>
      {isLoading ? (
        <div className="side-item side-item-muted">Loading…</div>
      ) : isError ? (
        <div className="side-item side-item-muted">Public collections are unavailable right now.</div>
      ) : collections.length === 0 ? (
        <div className="side-item side-item-muted">No public collections yet</div>
      ) : (
        collections.map((c) => (
          <Link
            key={c.id}
            to={`/public/collections/${c.slug}`}
            className="side-item"
            onClick={onNavigate}
          >
            <span className="side-item-label">{c.name}</span>
            <ArrowUpRight size={14} strokeWidth={1.75} aria-hidden="true" />
          </Link>
        ))
      )}
    </nav>
  );
}

// ─── User menu ────────────────────────────────────────────────────────────────

function UserMenu() {
  const user = useAppSelector(selectCurrentUser);
  const profile = useAppSelector(selectCurrentProfile);
  const { errorMessage, isWorking, signOut } = useAuthActions();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(containerRef, open, close);

  // Prefer stored profile fields; fall back to OAuth metadata.
  const displayName: string =
    profile?.displayName ??
    user?.user_metadata?.full_name ??
    user?.user_metadata?.name ??
    user?.email ??
    "Account";
  const handle: string =
    profile?.githubUsername ??
    user?.user_metadata?.user_name ??
    user?.user_metadata?.preferred_username ??
    user?.email?.split("@")[0] ??
    "";
  const avatarUrl = profile?.avatarUrl ?? user?.user_metadata?.avatar_url ?? null;
  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div ref={containerRef} className="side-foot">
      {open ? (
        <div className="menu anim-menu" role="menu" aria-label="Account">
          <div className="menu-label" translate="no">
            {user?.email}
          </div>
          <Link to="/profile" className="menu-item" role="menuitem" onClick={close}>
            <UserRound size={15} strokeWidth={1.75} />
            Edit profile
          </Link>
          <div className="menu-theme-row">
            <span>Theme</span>
            <ThemeSwitch />
          </div>
          <div className="menu-sep" />
          <button
            type="button"
            className="menu-item"
            role="menuitem"
            disabled={isWorking}
            onClick={() => {
              close();
              void signOut();
            }}
          >
            <LogOut size={15} strokeWidth={1.75} />
            {isWorking ? "Signing out…" : "Sign out"}
          </button>
          {errorMessage ? (
            <p className="field-error" role="alert" style={{ padding: "4px 9px 6px" }}>
              {errorMessage}
            </p>
          ) : null}
        </div>
      ) : null}

      <button
        type="button"
        className="user-button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="avatar">
          {avatarUrl ? <img src={avatarUrl} alt="" width={24} height={24} /> : initials || "?"}
        </span>
        <span className="user-button-text">
          <span className="user-button-name">{displayName}</span>
          {handle ? (
            <span className="user-button-handle" translate="no">
              @{handle}
            </span>
          ) : null}
        </span>
        <ChevronsUpDown size={14} strokeWidth={1.75} aria-hidden="true" />
      </button>
    </div>
  );
}

// ─── Shell ────────────────────────────────────────────────────────────────────

type AppShellProps = PropsWithChildren<{
  collectionCounts: Record<string, number>;
  collections: Collection[];
  isCollectionsLoading: boolean;
  onCreateCollection: () => void;
  onEditCollection: (collection: Collection) => void;
  onSelectCollection: (collectionId: string | null) => void;
  selectedCollectionId: string | null;
  query: string;
  setQuery: (q: string) => void;
}>;

export function AppShell({
  children,
  collectionCounts,
  collections,
  isCollectionsLoading,
  onCreateCollection,
  onEditCollection,
  onSelectCollection,
  selectedCollectionId,
  query,
  setQuery,
}: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const sidebarOpenRef = useRef(sidebarOpen);
  sidebarOpenRef.current = sidebarOpen;

  useFocusTrap(sidebarRef, sidebarOpen);

  // No-op on desktop, where the sidebar is never "open"; on mobile it returns
  // focus to the button that opened the drawer.
  const closeSidebar = useCallback(() => {
    if (!sidebarOpenRef.current) return;
    setSidebarOpen(false);
    menuButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && sidebarOpen) closeSidebar();
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setMobileSearchOpen(true);
        searchRef.current?.focus();
        searchRef.current?.select();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [sidebarOpen, closeSidebar]);

  // Move focus into the drawer when it opens on mobile.
  useEffect(() => {
    if (!sidebarOpen) return;
    sidebarRef.current?.querySelector<HTMLElement>("a[href], button:not([disabled])")?.focus();
  }, [sidebarOpen]);

  useEffect(() => {
    if (mobileSearchOpen) searchRef.current?.focus();
  }, [mobileSearchOpen]);

  const currentCollection = collections.find((c) => c.id === selectedCollectionId) ?? null;

  return (
    <div className="app">
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <aside ref={sidebarRef} className={cn("side", sidebarOpen && "is-open")} aria-label="Sidebar">
        <div className="side-head">
          <Link to="/" aria-label="DevLinks home">
            <Logo />
          </Link>
          {sidebarOpen ? (
            <button type="button" className="icon-btn" onClick={closeSidebar} aria-label="Close navigation">
              <X size={16} strokeWidth={1.75} />
            </button>
          ) : null}
        </div>

        <div className="side-scroll">
          <CollectionsSidebar
            collectionCounts={collectionCounts}
            collections={collections}
            isLoading={isCollectionsLoading}
            onCreateCollection={() => {
              closeSidebar();
              onCreateCollection();
            }}
            onEditCollection={(collection) => {
              closeSidebar();
              onEditCollection(collection);
            }}
            onSelectCollection={(id) => {
              closeSidebar();
              onSelectCollection(id);
            }}
            selectedCollectionId={selectedCollectionId}
          />
          <ExploreSection onNavigate={closeSidebar} />
        </div>

        <UserMenu />
      </aside>

      <div className={cn("side-scrim", sidebarOpen && "is-open")} onClick={closeSidebar} aria-hidden="true" />

      <div className="main">
        <div className="main-scroll">
          <header className="topbar">
            <button
              ref={menuButtonRef}
              type="button"
              className="icon-btn topbar-menu"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation"
              aria-expanded={sidebarOpen}
            >
              <Menu size={18} strokeWidth={1.75} />
            </button>

            <div className="topbar-crumbs">
              <span>Collections</span>
              {currentCollection ? (
                <>
                  <ChevronRight size={14} strokeWidth={1.75} aria-hidden="true" />
                  <strong>{currentCollection.name}</strong>
                </>
              ) : null}
            </div>

            <div className={cn("search", mobileSearchOpen && "is-open")} role="search">
              <Search className="search-icon" size={15} strokeWidth={1.75} aria-hidden="true" />
              <input
                ref={searchRef}
                className="input"
                type="search"
                name="q"
                autoComplete="off"
                spellCheck={false}
                placeholder="Search titles, URLs, tags…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    if (query) setQuery("");
                    else e.currentTarget.blur();
                  }
                }}
                onBlur={() => {
                  if (!query) setMobileSearchOpen(false);
                }}
                aria-label="Search bookmarks"
              />
              <div className="search-end">
                {query ? (
                  <button
                    type="button"
                    className="icon-btn icon-btn-sm"
                    onClick={() => {
                      setQuery("");
                      searchRef.current?.focus();
                    }}
                    aria-label="Clear search"
                  >
                    <X size={14} strokeWidth={1.75} />
                  </button>
                ) : (
                  <span className="kbd" aria-hidden="true">
                    {isApplePlatform ? "⌘ K" : "Ctrl K"}
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              className="icon-btn topbar-search-toggle"
              onClick={() => setMobileSearchOpen(true)}
              aria-label="Search bookmarks"
            >
              <Search size={17} strokeWidth={1.75} />
            </button>
          </header>

          <main id="main" className="page" tabIndex={-1}>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
