import { useEffect, useMemo, useRef, useState } from "react";
import { Copy, Download, Globe, Lock } from "lucide-react";
import { BookmarkList } from "@/components/dashboard/BookmarkList";
import { CollectionSheet } from "@/components/dashboard/CollectionSheet";
import { DeleteBookmarkDialog } from "@/components/dashboard/DeleteBookmarkDialog";
import { EditBookmarkModal, type EditBookmarkFormData } from "@/components/dashboard/EditBookmarkModal";
import { SaveBookmarkModal, type BookmarkFormData, type SaveBookmarkResult } from "@/components/dashboard/SaveBookmarkModal";
import { UrlSaveEntry } from "@/components/dashboard/UrlSaveEntry";
import { AppShell } from "@/components/layout/AppShell";
import { useAppSelector } from "@/app/hooks";
import { selectCurrentUser } from "@/features/auth/authSlice";
import {
  useCreateBookmarkMutation,
  useDeleteBookmarkMutation,
  useGetAllBookmarksQuery,
  useGetBookmarksQuery,
  useUpdateBookmarkMutation,
} from "@/features/bookmarks/bookmarksApi";
import {
  exportAllJson,
  exportAllMarkdown,
  exportCollectionJson,
  exportCollectionMarkdown,
} from "@/lib/export";
import { useSearchFilters } from "@/features/bookmarks/useSearchFilters";
import {
  useCreateCollectionMutation,
  useDeleteCollectionMutation,
  useGetCollectionsQuery,
  useToggleCollectionVisibilityMutation,
  useUpdateCollectionMutation,
} from "@/features/collections/collectionsApi";
import {
  hasFirstBookmarkBeenFired,
  markFirstBookmarkFired,
  track,
} from "@/lib/analytics";
import type { Bookmark, Collection, MetadataPreview } from "@/lib/types";

const FILTER_PILLS: { label: string; value: string | null }[] = [
  { label: "All", value: null },
  { label: "Docs", value: "documentation" },
  { label: "Repo", value: "repo" },
  { label: "Article", value: "article" },
  { label: "Video", value: "video" },
  { label: "Tool", value: "tool" },
  { label: "Tutorial", value: "tutorial" },
  { label: "Package", value: "package" },
  { label: "Talk", value: "talk" },
  { label: "Other", value: "other" },
];

type MutationErrorShape = { message?: string };

function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error !== null && "message" in error) {
    const candidate = error as MutationErrorShape;
    if (typeof candidate.message === "string" && candidate.message.length > 0) {
      return candidate.message;
    }
  }
  return fallback;
}

function ExportMenu({
  onExportJson,
  onExportMarkdown,
}: {
  onExportJson: () => void;
  onExportMarkdown: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        className="dl-btn"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <Download size={12} /> Export
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 6px)",
            background: "var(--bg-2)",
            border: "1px solid var(--line)",
            borderRadius: 7,
            padding: 4,
            minWidth: 150,
            zIndex: 50,
            boxShadow: "0 8px 24px oklch(0 0 0 / 0.4)",
          }}
        >
          {[
            { label: "Export as JSON", action: onExportJson },
            { label: "Export as Markdown", action: onExportMarkdown },
          ].map(({ label, action }) => (
            <button
              key={label}
              type="button"
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "7px 12px",
                background: "transparent",
                border: "none",
                borderRadius: 5,
                fontSize: 12.5,
                fontFamily: "var(--mono)",
                color: "var(--fg-1)",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-3)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              onClick={() => { action(); setOpen(false); }}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Toast({ msg, onDone }: { msg: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2400);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="dl-toast" role="status">
      <span className="dl-toast-ok">✓</span>
      <span>{msg}</span>
    </div>
  );
}

export function DashboardPage() {
  const user = useAppSelector(selectCurrentUser);
  const { filters, setFilter, clearFilter, resetFilters } = useSearchFilters();

  const selectedCollectionId = filters.collectionId;

  const [collectionError, setCollectionError] = useState<string | null>(null);
  const [metadataPreview, setMetadataPreview] = useState<MetadataPreview | null>(null);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [pendingDeleteBookmark, setPendingDeleteBookmark] = useState<Bookmark | null>(null);
  const [freshId, setFreshId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Collection sheet
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<"create" | "edit">("create");
  const [sheetCollection, setSheetCollection] = useState<Collection | null>(null);

  const [draftQuery, setDraftQuery] = useState(filters.query);

  useEffect(() => {
    setDraftQuery(filters.query);
  }, [filters.query]);

  useEffect(() => {
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

  const {
    currentData: bookmarks = [],
    isError: isBookmarksError,
    isLoading: isBookmarksLoading,
  } = useGetBookmarksQuery(
    { filters, userId: user?.id ?? "" },
    { skip: !user?.id || !selectedCollectionId },
  );

  const { currentData: allBookmarks = [] } = useGetAllBookmarksQuery(
    user?.id ?? "",
    { skip: !user?.id },
  );

  useEffect(() => {
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

  // ─── Handlers ──────────────────────────────────────────────────────────────

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

    setFreshId(result.bookmark.id);
    setTimeout(() => setFreshId(null), 1500);
    setSaveModalOpen(false);
    setMetadataPreview(null);
    setToast(`Saved to ${selectedCollection?.name ?? "collection"}`);
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
    } catch (error) {
      setCollectionError(getErrorMessage(error, "Bookmark could not be deleted."));
    }
  }

  async function handleCreateCollection(input: { description: string; name: string }) {
    if (!user?.id) {
      setCollectionError("You must be signed in to create a collection.");
      return;
    }
    const created = await createCollection({
      userId: user.id,
      name: input.name,
      description: input.description || null,
    }).unwrap();
    setFilter("collectionId", created.id);
    setCollectionError(null);
  }

  async function handleUpdateCollection(input: { description: string; id: string; name: string }) {
    if (!user?.id) {
      setCollectionError("You must be signed in to update a collection.");
      return;
    }
    const updated = await updateCollection({
      id: input.id,
      userId: user.id,
      name: input.name,
      description: input.description || null,
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
      setCollectionError(getErrorMessage(error, "Could not update collection visibility."));
    }
  }

  async function handleDeleteCollection(collectionId: string) {
    if (!user?.id) {
      setCollectionError("You must be signed in to delete a collection.");
      return;
    }
    try {
      await deleteCollection({ id: collectionId, userId: user.id }).unwrap();
      setCollectionError(null);
      if (selectedCollectionId === collectionId) {
        clearFilter("collectionId");
      }
    } catch (error) {
      setCollectionError(
        getErrorMessage(error, "Collection deletion failed. Non-empty collections cannot be removed."),
      );
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
    ? getErrorMessage(collectionsError, "Collections could not be loaded.")
    : null;

  const scopeTags = useMemo(() => {
    if (bookmarks.length === 0) return [];
    const set = new Map<string, number>();
    bookmarks.forEach((b) => b.tags.forEach((t) => set.set(t, (set.get(t) ?? 0) + 1)));
    return Array.from(set.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([t]) => t);
  }, [bookmarks]);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { all: bookmarks.length };
    FILTER_PILLS.forEach(({ value }) => {
      if (value) counts[value] = bookmarks.filter((b) => b.resourceType === value).length;
    });
    return counts;
  }, [bookmarks]);

  function toggleTagFilter(tag: string) {
    if (filters.tag === tag) clearFilter("tag");
    else setFilter("tag", tag);
  }

  const DOT_PALETTE = [
    "oklch(0.68 0.17 40)", "oklch(0.72 0.16 280)", "oklch(0.78 0.15 200)",
    "oklch(0.75 0.14 90)", "oklch(0.70 0.12 320)", "oklch(0.73 0.14 160)", "oklch(0.65 0.15 60)",
  ];
  const selectedCollIdx = collections.findIndex((c) => c.id === selectedCollectionId);
  const collDot = selectedCollIdx >= 0 ? DOT_PALETTE[selectedCollIdx % DOT_PALETTE.length] : "var(--accent)";

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <AppShell
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
      {/* ── Collection header ─────────────────────────────────────── */}
      <div className="dl-collection-head">
        <div style={{ minWidth: 0, flex: 1 }}>
          <h1
            className="dl-collection-title"
            style={{ "--dot": collDot } as React.CSSProperties}
          >
            <span className="dl-collection-title-dot" />
            {selectedCollection ? selectedCollection.name : "All bookmarks"}
          </h1>
          <p className="dl-collection-desc">
            {selectedCollection?.description?.trim() ||
              (selectedCollection ? "No description yet." : "Everything saved across collections.")}
          </p>
          <div className="dl-collection-meta">
            <span className="dl-collection-meta-item">
              📁 {bookmarks.length} bookmark{bookmarks.length !== 1 ? "s" : ""}
            </span>
            {selectedCollection?.isPublic ? (
              <>
                <span className="dl-pub-badge">
                  <Globe size={9} /> public
                </span>
                {selectedCollection.slug ? (
                  <span className="dl-collection-meta-item" style={{ color: "var(--fg-3)" }}>
                    devlinks.dev/c/{selectedCollection.slug}
                  </span>
                ) : null}
              </>
            ) : selectedCollection ? (
              <span className="dl-collection-meta-item">
                <Lock size={11} /> private
              </span>
            ) : null}
          </div>
        </div>

        <div className="dl-head-actions">
          {selectedCollection?.isPublic && selectedCollection.slug ? (
            <button
              type="button"
              className="dl-btn"
              onClick={() => void navigator.clipboard.writeText(`${window.location.origin}/public/collections/${selectedCollection.slug}`)}
            >
              <Copy size={12} /> Copy link
            </button>
          ) : null}
          <ExportMenu
            onExportJson={() => {
              if (selectedCollection) {
                exportCollectionJson(bookmarks, selectedCollection);
              } else {
                exportAllJson(allBookmarks, collections);
              }
            }}
            onExportMarkdown={() => {
              if (selectedCollection) {
                exportCollectionMarkdown(bookmarks, selectedCollection);
              } else {
                exportAllMarkdown(allBookmarks, collections);
              }
            }}
          />
          {selectedCollection ? (
            <button
              type="button"
              className="dl-btn"
              onClick={() => openEditSheet(selectedCollection)}
            >
              Edit collection
            </button>
          ) : (
            <button
              type="button"
              className="dl-btn primary"
              onClick={openCreateSheet}
            >
              New collection
            </button>
          )}
        </div>
      </div>

      {/* ── URL save bar ──────────────────────────────────────────── */}
      <UrlSaveEntry
        activeCollection={selectedCollection}
        onPreviewReady={handlePreviewReady}
        onOpenSaveModal={() => setSaveModalOpen(true)}
        preview={metadataPreview}
      />

      {/* ── Toolbar: type + tag filters ───────────────────────────── */}
      <div className="dl-toolbar">
        <span className="dl-toolbar-label">Type</span>
        <div className="dl-filter-group">
          {FILTER_PILLS.map(({ label, value }) => {
            const isActive = filters.resourceType === value;
            const count = typeCounts[value ?? "all"] ?? 0;
            return (
              <button
                key={label}
                type="button"
                className={`dl-filter-chip${isActive ? " active" : ""}${count === 0 && value !== null ? " muted" : ""}`}
                onClick={() =>
                  isActive ? clearFilter("resourceType") : setFilter("resourceType", value)
                }
                aria-pressed={isActive}
              >
                {label}
                <span className="dl-chip-count">{count}</span>
              </button>
            );
          })}
        </div>

        {scopeTags.length > 0 ? (
          <>
            <span className="dl-toolbar-label" style={{ marginLeft: 6 }}>Tags</span>
            <div className="dl-tag-filter">
              {scopeTags.map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`dl-tag-chip${filters.tag === t ? " active" : ""}`}
                  onClick={() => toggleTagFilter(t)}
                  aria-pressed={filters.tag === t}
                >
                  {t}
                </button>
              ))}
              {filters.tag && !scopeTags.includes(filters.tag) ? (
                <button
                  type="button"
                  className="dl-tag-chip active"
                  onClick={() => clearFilter("tag")}
                >
                  {filters.tag}
                  <span className="dl-tag-chip-remove">×</span>
                </button>
              ) : null}
            </div>
          </>
        ) : null}

        <div className="dl-toolbar-right">
          {activeFilterCount > 0 ? (
            <button
              type="button"
              className="dl-btn danger"
              style={{ padding: "3px 10px", fontSize: 11.5 }}
              onClick={() => {
                setDraftQuery("");
                resetFilters();
              }}
            >
              Reset
            </button>
          ) : null}
          <span className="dl-result-count">
            <em>{bookmarks.length}</em> bookmark{bookmarks.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* ── Bookmark list — full width ─────────────────────────────── */}
      <BookmarkList
        activeTag={filters.tag}
        bookmarks={bookmarks}
        hasActiveFilters={activeFilterCount > 0}
        isError={isBookmarksError}
        isLoading={isBookmarksLoading}
        onDeleteRequest={setPendingDeleteBookmark}
        onEdit={setEditingBookmark}
        onResetFilters={() => {
          setDraftQuery("");
          resetFilters();
        }}
        onTagClick={(tag) => toggleTagFilter(tag)}
        freshId={freshId}
      />

      {/* ── Collection sheet ──────────────────────────────────────── */}
      <CollectionSheet
        activeCollection={sheetCollection ?? selectedCollection}
        busyState={busyState}
        collections={collections}
        errorMessage={collectionError ?? collectionsLoadMessage}
        isOpen={sheetOpen}
        mode={sheetMode}
        onClose={() => setSheetOpen(false)}
        onCreate={handleCreateCollection}
        onDelete={handleDeleteCollection}
        onTogglePublic={handleTogglePublic}
        onUpdate={handleUpdateCollection}
      />

      {/* ── Modals ────────────────────────────────────────────────── */}
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
          isOpen={true}
          isSaving={updateBookmarkState.isLoading}
          onClose={() => setEditingBookmark(null)}
          onSave={(data) => handleBookmarkEditSave(data)}
        />
      ) : null}

      {pendingDeleteBookmark ? (
        <DeleteBookmarkDialog
          bookmark={pendingDeleteBookmark}
          onCancel={() => setPendingDeleteBookmark(null)}
          onConfirm={() => void handleBookmarkDeleteConfirm()}
        />
      ) : null}

      {toast ? (
        <Toast msg={toast} onDone={() => setToast(null)} />
      ) : null}
    </AppShell>
  );
}
