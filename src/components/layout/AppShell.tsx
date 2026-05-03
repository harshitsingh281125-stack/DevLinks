import { useEffect, useRef, useState, type PropsWithChildren } from "react";
import { BookOpen, ExternalLink, LogOut, Menu, Search, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useAppSelector } from "@/app/hooks";
import { CollectionsSidebar } from "@/components/dashboard/CollectionsSidebar";
import { useGetAllPublicCollectionsQuery } from "@/features/public/publicApi";
import { useFocusTrap } from "@/lib/useFocusTrap";
import { selectCurrentUser } from "@/features/auth/authSlice";
import { useAuthActions } from "@/features/auth/useAuthActions";
import type { Collection } from "@/lib/types";

// ─── Public collections section ───────────────────────────────────────────────

function PublicCollectionsSection() {
  const { data: collections = [], isLoading, isError } = useGetAllPublicCollectionsQuery();

  return (
    <div className="dl-sidebar-section">
      <div className="dl-sidebar-label">
        <span>Public</span>
      </div>
      {isLoading ? (
        <div className="dl-nav-btn" style={{ color: "var(--fg-4)", fontSize: 12 }}>
          Loading…
        </div>
      ) : isError ? (
        <div className="dl-nav-btn" style={{ color: "var(--danger)", fontSize: 12 }}>
          Could not load
        </div>
      ) : collections.length === 0 ? (
        <div className="dl-nav-btn" style={{ color: "var(--fg-4)", fontSize: 12 }}>
          No public collections yet
        </div>
      ) : (
        collections.map((c) => (
          <Link
            key={c.id}
            to={`/public/collections/${c.slug}`}
            className="dl-nav-btn"
            style={{ textDecoration: "none" }}
          >
            <BookOpen size={13} style={{ color: "var(--fg-3)", flexShrink: 0 }} />
            <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {c.name}
            </span>
            <ExternalLink size={11} style={{ color: "var(--fg-4)", flexShrink: 0 }} />
          </Link>
        ))
      )}
    </div>
  );
}

// ─── Shell ────────────────────────────────────────────────────────────────────

type AppShellProps = PropsWithChildren<{
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
  collections,
  isCollectionsLoading,
  onCreateCollection,
  onEditCollection,
  onSelectCollection,
  selectedCollectionId,
  query,
  setQuery,
}: AppShellProps) {
  const user = useAppSelector(selectCurrentUser);
  const { errorMessage, isWorking, signOut } = useAuthActions();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const userChipRef = useRef<HTMLButtonElement>(null);

  useFocusTrap(sidebarRef, sidebarOpen);

  // Escape closes drawer or user menu
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (sidebarOpen) {
          setSidebarOpen(false);
          menuButtonRef.current?.focus();
        }
        if (userMenuOpen) setUserMenuOpen(false);
      }
      // Cmd+K / Ctrl+K focuses topbar search
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        document.querySelector<HTMLInputElement>(".dl-topbar-search input")?.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [sidebarOpen, userMenuOpen]);

  // Move initial focus into drawer when it opens
  useEffect(() => {
    if (!sidebarOpen || !sidebarRef.current) return;
    const first = sidebarRef.current.querySelector<HTMLElement>("a[href], button:not([disabled])");
    first?.focus();
  }, [sidebarOpen]);

  // Close user menu when clicking outside
  useEffect(() => {
    if (!userMenuOpen) return;
    function onOutside(e: MouseEvent) {
      if (userChipRef.current && !userChipRef.current.parentElement?.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [userMenuOpen]);

  function closeSidebar() {
    setSidebarOpen(false);
    menuButtonRef.current?.focus();
  }

  // Derive user initials from name or email
  const displayName =
    user?.user_metadata?.full_name ??
    user?.user_metadata?.name ??
    user?.email ??
    "User";
  const handle = user?.user_metadata?.preferred_username ?? user?.email?.split("@")[0] ?? "user";
  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((s: string) => s[0]?.toUpperCase() ?? "")
    .join("");

  // Derive current collection label for breadcrumb
  const currentCollLabel = selectedCollectionId
    ? (collections.find((c) => c.id === selectedCollectionId)?.name ?? "collection")
    : "all";

  return (
    <div className="dl-app" data-accent="violet">

      {/* ── Sidebar ───────────────────────────────────────────────── */}
      <aside
        ref={sidebarRef}
        className={`dl-sidebar${sidebarOpen ? " open" : ""}`}
        aria-label="Navigation"
      >
        {/* Head: logo + user chip */}
        <div className="dl-sidebar-head">
          <Link to="/" className="dl-logo" onClick={closeSidebar}>
            <span className="dl-logo-mark" />
            <span>dev<em>links</em></span>
          </Link>

          <div style={{ position: "relative" }}>
            <button
              ref={userChipRef}
              className="dl-user-chip"
              onClick={() => setUserMenuOpen((o) => !o)}
              aria-expanded={userMenuOpen}
              aria-label="User menu"
            >
              <span className="dl-user-avatar">{initials || "U"}</span>
              <span>@{handle}</span>
            </button>

            {userMenuOpen && (
              <div className="dl-user-menu">
                <div style={{ padding: "6px 10px 8px", fontFamily: "var(--mono)", fontSize: 11, color: "var(--fg-3)", borderBottom: "1px solid var(--line-soft)", marginBottom: 4 }}>
                  {user?.email}
                </div>
                <button
                  className="danger"
                  onClick={() => {
                    setUserMenuOpen(false);
                    void signOut();
                  }}
                  disabled={isWorking}
                >
                  <LogOut size={13} />
                  {isWorking ? "Signing out…" : "Log out"}
                </button>
                {errorMessage ? (
                  <div style={{ padding: "4px 10px", fontSize: 11, color: "var(--danger)", fontFamily: "var(--mono)" }}>
                    {errorMessage}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>

        {/* Nav sections */}
        <CollectionsSidebar
          collections={collections}
          isLoading={isCollectionsLoading}
          onCreateCollection={() => {
            onCreateCollection();
            if (sidebarOpen) closeSidebar();
          }}
          onEditCollection={(collection) => {
            onEditCollection(collection);
            if (sidebarOpen) closeSidebar();
          }}
          onSelectCollection={(id) => {
            onSelectCollection(id);
            if (sidebarOpen) closeSidebar();
          }}
          selectedCollectionId={selectedCollectionId}
        />

        <PublicCollectionsSection />

        {/* Footer */}
        <div className="dl-sidebar-foot">
          <span>v0.4.0</span>
          <span>
            <span className="dl-kbd">?</span> shortcuts
          </span>
        </div>
      </aside>

      {/* ── Mobile backdrop ───────────────────────────────────────── */}
      <div
        className={`dl-sidebar-backdrop${sidebarOpen ? " open" : ""}`}
        role="presentation"
        onClick={closeSidebar}
      />

      {/* ── Main ─────────────────────────────────────────────────── */}
      <div className="dl-main">

        {/* Mobile header */}
        <div className="dl-mobile-header">
          <button
            ref={menuButtonRef}
            className="dl-icon-btn"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation"
            aria-expanded={sidebarOpen}
          >
            <Menu size={18} />
          </button>
          <Link to="/" className="dl-logo" style={{ fontSize: 13 }}>
            <span className="dl-logo-mark" style={{ width: 22, height: 22, fontSize: 11 }} />
            <span>dev<em>links</em></span>
          </Link>
          <button className="dl-icon-btn" aria-label="Search">
            <Search size={16} />
          </button>
        </div>

        {/* Topbar */}
        <div className="dl-topbar">
          <div className="dl-breadcrumb">
            <span className="dl-breadcrumb-dot" />
            <span>devlinks</span>
            <span className="sep">/</span>
            <span>{handle}</span>
            <span className="sep">/</span>
            <span className="current">{currentCollLabel}</span>
          </div>

          <div className="dl-topbar-search">
            <span className="dl-topbar-search-icon">
              <Search size={13} />
            </span>
            <input
              type="text"
              placeholder="Search bookmarks, tags, domains…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search bookmarks"
            />
            <span className="dl-topbar-kbd">⌘K</span>
            {query ? (
              <button
                type="button"
                style={{ position: "absolute", right: 32, top: "50%", transform: "translateY(-50%)", background: "none", border: 0, color: "var(--fg-3)", display: "flex", cursor: "pointer", padding: 2 }}
                onClick={() => setQuery("")}
                aria-label="Clear search"
              >
                <X size={11} />
              </button>
            ) : null}
          </div>
        </div>

        {/* Page content */}
        <div className="dl-page">
          {children}
        </div>
      </div>
    </div>
  );
}
