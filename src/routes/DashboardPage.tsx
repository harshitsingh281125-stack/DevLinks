import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Download, FolderPlus, Globe, Info, Link as LinkIcon, Lock, Route, Settings2, TriangleAlert, UserRound, X } from "lucide-react";
import { Link } from "react-router-dom";
import { BookmarkList } from "@/components/dashboard/BookmarkList";
import { CollectionSheet } from "@/components/dashboard/CollectionSheet";
import { DeleteBookmarkDialog } from "@/components/dashboard/DeleteBookmarkDialog";
import { EditBookmarkModal, type EditBookmarkFormData } from "@/components/dashboard/EditBookmarkModal";
import { SaveBookmarkModal, type BookmarkFormData, type SaveBookmarkResult } from "@/components/dashboard/SaveBookmarkModal";
import { UrlSaveEntry } from "@/components/dashboard/UrlSaveEntry";
import { AppShell } from "@/components/layout/AppShell";
import { useAppSelector } from "@/app/hooks";
import { selectCurrentProfile, selectCurrentUser } from "@/features/auth/authSlice";
import {
  useCreateBookmarkMutation,
  useDeleteBookmarkMutation,
  useGetAllBookmarksQuery,
  useGetBookmarksQuery,
  useReorderBookmarksMutation,
  useUpdateBookmarkMutation,
} from "@/features/bookmarks/bookmarksApi";
import { useSearchFilters } from "@/features/bookmarks/useSearchFilters";
import {
  useCreateCollectionMutation,
  useDeleteCollectionMutation,
  useGetCollectionsQuery,
  useToggleCollectionVisibilityMutation,
  useUpdateCollectionMutation,
} from "@/features/collections/collectionsApi";
import { hasFirstBookmarkBeenFired, markFirstBookmarkFired, track } from "@/lib/analytics";
import {
  exportAllJson,
  exportAllMarkdown,
  exportCollectionJson,
  exportCollectionMarkdown,
} from "@/lib/export";
import { formatCount } from "@/lib/format";
import { RESOURCE_TYPE_LABELS } from "@/lib/resourceTypes";
import { sortByPosition } from "@/lib/roadmap";
import type { Bookmark, Collection, MetadataPreview } from "@/lib/types";
import { RESOURCE_TYPES } from "@/lib/types";
import { useDismiss } from "@/lib/useDismiss";

function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.length > 0) return message;
  }
  return fallback;
}

function readBannerDismissed(key: string | null) {
  if (!key) return true;
  try {
    return localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

// ─── Export menu ──────────────────────────────────────────────────────────────

function ExportMenu({
  onExportJson,
  onExportMarkdown,
}: {
  onExportJson: () => void;
  onExportMarkdown: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        className="btn btn-secondary"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Download size={14} strokeWidth={1.75} aria-hidden="true" />
        Export
        <ChevronDown size={13} strokeWidth={1.75} aria-hidden="true" />
      </button>
      {open ? (
        <div className="menu anim-menu" role="menu">
          {[
            { label: "Markdown", meta: ".md", action: onExportMarkdown },
            { label: "JSON", meta: ".json", action: onExportJson },
          ].map(({ label, meta, action }) => (
            <button
              key={label}
              type="button"
              role="menuitem"
              className="menu-item"
              onClick={() => {
                action();
                close();
              }}
            >
              {label}
              <span className="menu-item-meta">{meta}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

type ToastState = { message: string; tone: "ok" | "error" } | null;

function Toast({ toast, onDone }: { toast: NonNullable<ToastState>; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, toast.tone === "error" ? 5000 : 2600);
    return () => clearTimeout(t);
  }, [toast, onDone]);

  return (
    <div className="toast anim-toast" role={toast.tone === "error" ? "alert" : "status"}>
      {toast.tone === "error" ? (
        <TriangleAlert size={15} strokeWidth={2} />
      ) : (
        <Check size={15} strokeWidth={2.25} />
      )}
      <span>{toast.message}</span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function DashboardPage() {
  const user = useAppSelector(selectCurrentUser);
  const profile = useAppSelector(selectCurrentProfile);
  const { filters, setFilter, clearFilter, resetFilters } = useSearchFilters();
  const saveBarRef = useRef<HTMLInputElement>(null);

  // "Complete your profile" callout, dismissible per user.
  const profileBannerKey = user ? `devlinks:profile-banner-dismissed:${user.id}` : null;
  const [bannerDismissed, setBannerDismissed] = useState(() => readBannerDismissed(profileBannerKey));
  const profileIncomplete = !profile?.bio && !profile?.displayName && !profile?.websiteUrl;
  const showProfileBanner = !bannerDismissed && profileIncomplete;

  function dismissBanner() {
    try {
      if (profileBannerKey) localStorage.setItem(profileBannerKey, "1");
    } catch {
      // Dismissal just won't persist across visits.
    }
    setBannerDismissed(true);
  }

  const selectedCollectionId = filters.collectionId;

  const [collectionError, setCollectionError] = useState<string | null>(null);
  const [metadataPreview, setMetadataPreview] = useState<MetadataPreview | null>(null);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [pendingDeleteBookmark, setPendingDeleteBookmark] = useState<Bookmark | null>(null);
  const [freshId, setFreshId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const clearToast = useCallback(() => setToast(null), []);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<"create" | "edit">("create");
  const [sheetCollection, setSheetCollection] = useState<Collection | null>(null);

  const [draftQuery, setDraftQuery] = useState(filters.query);

  useEffect(() => {
    setDraftQuery(filters.query);
  }, [filters.query]);

  useEffect(() => {
    if (draftQuery === filters.query) return;
    const id = setTimeout(() => {
      setFilter("query", draftQuery);
      if (draftQuery.trim().length > 0) {
        track({ name: "search", props: { query: draftQuery.trim() } });
      }
    }, 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftQuery]);

  const {
    currentData: collections = [],
    error: collectionsError,
    isLoading: isCollectionsLoading,
    isFetching: isCollectionsFetching,
  } = useGetCollectionsQuery(user?.id ?? "", { skip: !user?.id });

  const [createCollection, createState] = useCreateCollectionMutation();
  const [updateCollection, updateState] = useUpdateCollectionMutation();
  const [deleteCollection, deleteState] = useDeleteCollectionMutation();
  const [toggleCollectionVisibility, toggleState] = useToggleCollectionVisibilityMutation();
  const [createBookmark, createBookmarkState] = useCreateBookmarkMutation();
  const [updateBookmark, updateBookmarkState] = useUpdateBookmarkMutation();
  const [deleteBookmark] = useDeleteBookmarkMutation();
  const [reorderBookmarks] = useReorderBookmarksMutation();

  const {
    currentData: bookmarks = [],
    isError: isBookmarksError,
    isLoading: isBookmarksLoading,
  } = useGetBookmarksQuery(
    { filters, userId: user?.id ?? "" },
    { skip: !user?.id || !selectedCollectionId },
  );

  const { currentData: allBookmarks = [] } = useGetAllBookmarksQuery(user?.id ?? "", {
    skip: !user?.id,
  });

  // Set when we select a collection we just created, until the refetched list includes it.
  const pendingSelectIdRef = useRef<string | null>(null);

  useEffect(() => {
    const pending = pendingSelectIdRef.current;
    if (pending) {
      if (!collections.some((c) => c.id === pending)) return;
      pendingSelectIdRef.current = null;
    }
    if (collections.length === 0) {
      clearFilter("collectionId");
      return;
    }
    const selectedStillExists = collections.some((c) => c.id === selectedCollectionId);
    if (!selectedStillExists) {
      setFilter("collectionId", collections[0]?.id ?? null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collections, selectedCollectionId]);

  const selectedCollection = useMemo(
    () => collections.find((c) => c.id === selectedCollectionId) ?? null,
    [collections, selectedCollectionId],
  );

  useEffect(() => {
    setMetadataPreview(null);
    setSaveModalOpen(false);
  }, [selectedCollectionId]);

  const activeFilterCount = [filters.query, filters.tag, filters.resourceType].filter(Boolean).length;

  // Roadmap collections list links in the author's order and number them by
  // their place in the whole collection, even when a filter hides some.
  const isRoadmap = selectedCollection?.isRoadmap ?? false;
  const visibleBookmarks = useMemo(
    () => (isRoadmap ? sortByPosition(bookmarks) : bookmarks),
    [bookmarks, isRoadmap],
  );
  const stepNumbers = useMemo(() => {
    const steps = new Map<string, number>();
    if (!isRoadmap || !selectedCollectionId) return steps;
    sortByPosition(allBookmarks.filter((b) => b.collectionId === selectedCollectionId)).forEach((b, i) =>
      steps.set(b.id, i + 1),
    );
    return steps;
  }, [allBookmarks, isRoadmap, selectedCollectionId]);

  // ─── Sheet helpers ──────────────────────────────────────────────────────────

  function openCreateSheet() {
    setSheetMode("create");
    setSheetCollection(null);
    setCollectionError(null);
    setSheetOpen(true);
  }

  function openEditSheet(collection: Collection) {
    setSheetMode("edit");
    setSheetCollection(collection);
    setCollectionError(null);
    setSheetOpen(true);
  }

  // ─── Handlers ───────────────────────────────────────────────────────────────

  function handlePreviewReady(preview: MetadataPreview) {
    setMetadataPreview(preview);
    setSaveModalOpen(true);
  }

  async function handleBookmarkSave(data: BookmarkFormData): Promise<SaveBookmarkResult> {
    if (!user?.id || !metadataPreview) return {};

    const result = await createBookmark({
      userId: user.id,
      collectionId: data.collectionId,
      title: data.title,
      url: metadataPreview.url,
      description: data.description || null,
      domain: metadataPreview.domain,
      faviconUrl: metadataPreview.faviconUrl,
      imageUrl: metadataPreview.imageUrl,
      resourceType: data.resourceType,
      tags: data.tags,
    }).unwrap();

    if (result.kind === "duplicate") {
      return { duplicate: result.existing };
    }

    if (!hasFirstBookmarkBeenFired()) {
      track({ name: "first_bookmark" });
      markFirstBookmarkFired();
    }

    const savedTo = collections.find((c) => c.id === data.collectionId)?.name ?? "your collection";
    setFreshId(result.bookmark.id);
    setTimeout(() => setFreshId(null), 1700);
    setSaveModalOpen(false);
    setMetadataPreview(null);
    setToast({ message: `Saved to ${savedTo}`, tone: "ok" });
    return {};
  }

  function handleEditExistingBookmark(bookmark: Bookmark) {
    setSaveModalOpen(false);
    setMetadataPreview(null);
    setEditingBookmark(bookmark);
  }

  async function handleBookmarkEditSave(data: EditBookmarkFormData) {
    if (!user?.id || !editingBookmark) return;
    await updateBookmark({
      id: editingBookmark.id,
      userId: user.id,
      collectionId: data.collectionId,
      title: data.title,
      description: data.description || null,
      resourceType: data.resourceType,
      tags: data.tags,
    }).unwrap();
    setEditingBookmark(null);
    setToast({ message: "Changes saved", tone: "ok" });
  }

  async function handleBookmarkDeleteConfirm() {
    if (!user?.id || !pendingDeleteBookmark) return;
    const target = pendingDeleteBookmark;
    setPendingDeleteBookmark(null);
    try {
      await deleteBookmark({
        id: target.id,
        userId: user.id,
        collectionId: target.collectionId,
        filters,
      }).unwrap();
      setToast({ message: "Bookmark deleted", tone: "ok" });
    } catch (error) {
      setToast({ message: getErrorMessage(error, "The bookmark couldn’t be deleted."), tone: "error" });
    }
  }

  // Create / update / delete throw on failure so the sheet can show the reason inline.
  async function handleCreateCollection(input: { description: string; name: string; isRoadmap: boolean }) {
    if (!user?.id) throw new Error("Your session expired. Sign in again to create a collection.");
    const created = await createCollection({
      userId: user.id,
      name: input.name,
      description: input.description || null,
      isRoadmap: input.isRoadmap,
    }).unwrap();
    pendingSelectIdRef.current = created.id;
    setFilter("collectionId", created.id);
    setCollectionError(null);
  }

  async function handleUpdateCollection(input: { description: string; id: string; name: string; isRoadmap: boolean }) {
    if (!user?.id) throw new Error("Your session expired. Sign in again to edit this collection.");
    const updated = await updateCollection({
      id: input.id,
      userId: user.id,
      name: input.name,
      description: input.description || null,
      isRoadmap: input.isRoadmap,
    }).unwrap();
    setFilter("collectionId", updated.id);
    setCollectionError(null);
  }

  async function handleTogglePublic(input: { id: string; isPublic: boolean; slug: string | null }) {
    if (!user?.id) return;
    try {
      await toggleCollectionVisibility({
        id: input.id,
        userId: user.id,
        isPublic: input.isPublic,
        slug: input.slug,
      }).unwrap();
      track({ name: "public_toggle", props: { collectionId: input.id, isPublic: input.isPublic } });
      setCollectionError(null);
    } catch (error) {
      setCollectionError(getErrorMessage(error, "Visibility couldn’t be changed. Try again in a moment."));
      throw error;
    }
  }

  async function handleDeleteCollection(collectionId: string) {
    if (!user?.id) throw new Error("Your session expired. Sign in again to delete this collection.");
    await deleteCollection({ id: collectionId, userId: user.id }).unwrap();
    setCollectionError(null);
    if (selectedCollectionId === collectionId) clearFilter("collectionId");
    setToast({ message: "Collection deleted", tone: "ok" });
  }

  async function handleReorder(orderedIds: string[]) {
    if (!user?.id || !selectedCollectionId) return;
    try {
      await reorderBookmarks({ collectionId: selectedCollectionId, orderedIds, filters, userId: user.id }).unwrap();
    } catch (error) {
      setToast({ message: getErrorMessage(error, "The new order couldn’t be saved."), tone: "error" });
    }
  }

  async function copyPublicLink(slug: string) {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/public/collections/${slug}`);
      setToast({ message: "Public link copied", tone: "ok" });
    } catch {
      setToast({ message: "Clipboard access was blocked by the browser.", tone: "error" });
    }
  }

  // ─── Derived ────────────────────────────────────────────────────────────────

  const busyState = createState.isLoading
    ? "creating"
    : updateState.isLoading
      ? "updating"
      : deleteState.isLoading
        ? "deleting"
        : toggleState.isLoading
          ? "toggling"
          : "idle";

  const collectionsLoadMessage = collectionsError
    ? getErrorMessage(collectionsError, "Collections couldn’t be loaded.")
    : null;

  const collectionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allBookmarks.forEach((b) => {
      counts[b.collectionId] = (counts[b.collectionId] ?? 0) + 1;
    });
    return counts;
  }, [allBookmarks]);

  const scopeTags = useMemo(() => {
    const counts = new Map<string, number>();
    bookmarks.forEach((b) => b.tags.forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1)));
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([t]) => t);
  }, [bookmarks]);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    bookmarks.forEach((b) => {
      if (b.resourceType) counts[b.resourceType] = (counts[b.resourceType] ?? 0) + 1;
    });
    return counts;
  }, [bookmarks]);

  // Only offer types that exist in the current view (plus the active one).
  const visibleTypes = RESOURCE_TYPES.filter(
    (type) => (typeCounts[type] ?? 0) > 0 || filters.resourceType === type,
  );

  function toggleTagFilter(tag: string) {
    if (filters.tag === tag) clearFilter("tag");
    else setFilter("tag", tag);
  }

  function resetAllFilters() {
    setDraftQuery("");
    resetFilters();
  }

  const hasNoCollections = !isCollectionsLoading && collections.length === 0 && !collectionsError;

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <AppShell
      collectionCounts={collectionCounts}
      collections={collections}
      isCollectionsLoading={isCollectionsLoading || isCollectionsFetching}
      onCreateCollection={openCreateSheet}
      onEditCollection={openEditSheet}
      onSelectCollection={(collectionId) => {
        setFilter("collectionId", collectionId);
        setCollectionError(null);
      }}
      selectedCollectionId={selectedCollectionId}
      query={draftQuery}
      setQuery={setDraftQuery}
    >
      {showProfileBanner ? (
        <div className="callout">
          <UserRound size={16} strokeWidth={1.75} aria-hidden="true" />
          <p className="callout-text" style={{ margin: 0 }}>
            <strong>Add a name and bio.</strong> People who open your public collections will see them.
          </p>
          <Link to="/profile" className="btn btn-secondary btn-sm">
            Set up profile
          </Link>
          <button type="button" className="icon-btn icon-btn-sm" onClick={dismissBanner} aria-label="Dismiss">
            <X size={14} strokeWidth={1.75} />
          </button>
        </div>
      ) : null}

      {collectionsLoadMessage ? (
        <div className="notice notice-danger" role="alert" style={{ marginBottom: 20 }}>
          <TriangleAlert size={15} strokeWidth={1.75} />
          <div className="notice-body">
            <p className="notice-title">Collections didn’t load</p>
            <p className="notice-text">{collectionsLoadMessage}</p>
          </div>
        </div>
      ) : null}

      {hasNoCollections ? (
        <div className="empty" style={{ marginTop: 24 }}>
          <span className="empty-icon">
            <FolderPlus size={18} strokeWidth={1.75} />
          </span>
          <h1 className="empty-title">Start with a collection</h1>
          <p className="empty-text">
            Collections hold related links, like “React debugging” or “Auth reading list”. They stay
            private until you choose to share one.
          </p>
          <div className="empty-actions">
            <button type="button" className="btn btn-primary" onClick={openCreateSheet}>
              New collection
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="page-head">
            <div className="page-head-text">
              {selectedCollection ? (
                <h1 className="page-title">{selectedCollection.name}</h1>
              ) : (
                <span className="skeleton" style={{ width: 220, height: 26 }} aria-hidden="true" />
              )}
              {selectedCollection ? (
                <p className={selectedCollection.description?.trim() ? "page-desc" : "page-desc is-empty"}>
                  {selectedCollection.description?.trim() || "No description yet."}
                </p>
              ) : null}
              {selectedCollection ? (
                <div className="page-meta">
                  {selectedCollection.isRoadmap ? (
                    <span className="page-meta-item" style={{ color: "var(--fg-2)" }}>
                      <Route size={13} strokeWidth={1.75} aria-hidden="true" />
                      Roadmap · {formatCount(collectionCounts[selectedCollection.id] ?? bookmarks.length, "step")}
                    </span>
                  ) : (
                    <span className="page-meta-item">
                      {formatCount(collectionCounts[selectedCollection.id] ?? bookmarks.length, "bookmark")}
                    </span>
                  )}
                  {selectedCollection.isPublic ? (
                    <>
                      <span className="page-meta-item" style={{ color: "var(--accent-text)" }}>
                        <Globe size={13} strokeWidth={1.75} aria-hidden="true" /> Public
                      </span>
                      {selectedCollection.slug ? (
                        <a
                          className="page-meta-item"
                          href={`/public/collections/${selectedCollection.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          translate="no"
                        >
                          /public/collections/{selectedCollection.slug}
                        </a>
                      ) : null}
                    </>
                  ) : (
                    <span className="page-meta-item">
                      <Lock size={12} strokeWidth={1.75} aria-hidden="true" /> Private
                    </span>
                  )}
                </div>
              ) : null}
            </div>

            <div className="page-actions">
              {selectedCollection?.isPublic && selectedCollection.slug ? (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => void copyPublicLink(selectedCollection.slug!)}
                >
                  <LinkIcon size={14} strokeWidth={1.75} aria-hidden="true" />
                  Copy link
                </button>
              ) : null}
              <ExportMenu
                onExportJson={() => {
                  if (selectedCollection) exportCollectionJson(visibleBookmarks, selectedCollection);
                  else exportAllJson(allBookmarks, collections);
                }}
                onExportMarkdown={() => {
                  if (selectedCollection) exportCollectionMarkdown(visibleBookmarks, selectedCollection);
                  else exportAllMarkdown(allBookmarks, collections);
                }}
              />
              {selectedCollection ? (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => openEditSheet(selectedCollection)}
                >
                  <Settings2 size={14} strokeWidth={1.75} aria-hidden="true" />
                  Edit
                </button>
              ) : null}
            </div>
          </div>

          <UrlSaveEntry ref={saveBarRef} activeCollection={selectedCollection} onPreviewReady={handlePreviewReady} />

          {bookmarks.length > 0 || activeFilterCount > 0 ? (
            <div className="filters">
              <div className="seg" role="group" aria-label="Filter by type">
                <button
                  type="button"
                  className="seg-item"
                  aria-pressed={!filters.resourceType}
                  onClick={() => clearFilter("resourceType")}
                >
                  All
                </button>
                {visibleTypes.map((type) => {
                  const isActive = filters.resourceType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      className="seg-item"
                      aria-pressed={isActive}
                      onClick={() => (isActive ? clearFilter("resourceType") : setFilter("resourceType", type))}
                    >
                      {RESOURCE_TYPE_LABELS[type]}
                      <span className="seg-count">{typeCounts[type] ?? 0}</span>
                    </button>
                  );
                })}
              </div>

              {scopeTags.length > 0 || filters.tag ? (
                <div className="filters-tags" role="group" aria-label="Filter by tag">
                  {scopeTags.map((t) => (
                    <button
                      key={t}
                      type="button"
                      className="tag"
                      aria-pressed={filters.tag === t}
                      onClick={() => toggleTagFilter(t)}
                    >
                      {t}
                    </button>
                  ))}
                  {filters.tag && !scopeTags.includes(filters.tag) ? (
                    <button type="button" className="tag" aria-pressed="true" onClick={() => clearFilter("tag")}>
                      {filters.tag}
                      <X size={11} strokeWidth={2} aria-hidden="true" />
                    </button>
                  ) : null}
                </div>
              ) : null}

              <div className="filters-end">
                <span aria-live="polite">{formatCount(bookmarks.length, "result")}</span>
                {activeFilterCount > 0 ? (
                  <button type="button" className="btn btn-ghost btn-sm" onClick={resetAllFilters}>
                    Clear filters
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}

          {isRoadmap && visibleBookmarks.length > 1 ? (
            <p className="roadmap-hint">
              <Info size={13} strokeWidth={1.75} aria-hidden="true" />
              {activeFilterCount > 0
                ? "Showing part of the roadmap. Clear filters to reorder steps."
                : "Drag the handles, or use the arrows, to set the order readers follow."}
            </p>
          ) : null}

          <BookmarkList
            activeTag={filters.tag}
            bookmarks={visibleBookmarks}
            roadmap={
              isRoadmap
                ? { canReorder: activeFilterCount === 0, stepNumbers, onReorder: (ids) => void handleReorder(ids) }
                : undefined
            }
            hasActiveFilters={activeFilterCount > 0}
            isError={isBookmarksError}
            isLoading={isBookmarksLoading || (isCollectionsLoading && !selectedCollection)}
            onDeleteRequest={setPendingDeleteBookmark}
            onEdit={setEditingBookmark}
            onFocusSaveBar={() => saveBarRef.current?.focus()}
            onResetFilters={resetAllFilters}
            onTagClick={toggleTagFilter}
            freshId={freshId}
          />
        </>
      )}

      <CollectionSheet
        activeCollection={sheetCollection ?? selectedCollection}
        busyState={busyState}
        collections={collections}
        errorMessage={collectionError}
        isOpen={sheetOpen}
        mode={sheetMode}
        onClose={() => setSheetOpen(false)}
        onCreate={handleCreateCollection}
        onDelete={handleDeleteCollection}
        onTogglePublic={handleTogglePublic}
        onUpdate={handleUpdateCollection}
      />

      {metadataPreview ? (
        <SaveBookmarkModal
          collections={collections}
          defaultCollectionId={selectedCollectionId}
          isSaving={createBookmarkState.isLoading}
          isOpen={saveModalOpen}
          onClose={() => setSaveModalOpen(false)}
          onEditExisting={handleEditExistingBookmark}
          onSave={handleBookmarkSave}
          preview={metadataPreview}
        />
      ) : null}

      {editingBookmark ? (
        <EditBookmarkModal
          bookmark={editingBookmark}
          collections={collections}
          isOpen
          isSaving={updateBookmarkState.isLoading}
          onClose={() => setEditingBookmark(null)}
          onSave={handleBookmarkEditSave}
        />
      ) : null}

      {pendingDeleteBookmark ? (
        <DeleteBookmarkDialog
          bookmark={pendingDeleteBookmark}
          onCancel={() => setPendingDeleteBookmark(null)}
          onConfirm={() => void handleBookmarkDeleteConfirm()}
        />
      ) : null}

      {toast ? <Toast toast={toast} onDone={clearToast} /> : null}
    </AppShell>
  );
}
