import type { Bookmark } from "@/lib/types";
import { BookmarkCard } from "./BookmarkCard";

type BookmarkListProps = {
  activeTag?: string | null;
  bookmarks: Bookmark[];
  hasActiveFilters: boolean;
  isError?: boolean;
  isLoading: boolean;
  onDeleteRequest: (bookmark: Bookmark) => void;
  onEdit: (bookmark: Bookmark) => void;
  onResetFilters: () => void;
  onTagClick: (tag: string) => void;
  freshId?: string | null;
};

function SkeletonCard() {
  return (
    <div className="dl-sk-card">
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <div className="dl-sk-line" style={{ width: 28, height: 28, borderRadius: 5, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div className="dl-sk-line w-70" />
          <div className="dl-sk-line w-30" style={{ marginTop: 4, height: 10 }} />
        </div>
      </div>
      <div className="dl-sk-line h-20 w-90" />
      <div className="dl-sk-line w-70" />
      <div style={{ display: "flex", gap: 4 }}>
        <div className="dl-sk-line" style={{ width: 48, height: 18 }} />
        <div className="dl-sk-line" style={{ width: 36, height: 18 }} />
        <div className="dl-sk-line" style={{ width: 56, height: 18 }} />
      </div>
    </div>
  );
}

export function BookmarkList({
  activeTag,
  bookmarks,
  hasActiveFilters,
  isError = false,
  isLoading,
  onDeleteRequest,
  onEdit,
  onResetFilters,
  onTagClick,
  freshId,
}: BookmarkListProps) {
  if (isLoading) {
    return (
      <div className="dl-grid">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="dl-empty">
        <strong>Bookmarks could not be loaded</strong>
        There was a problem fetching your bookmarks. Try refreshing the page.
        <span className="dl-empty-cursor" />
      </div>
    );
  }

  if (bookmarks.length === 0) {
    return (
      <div className="dl-empty">
        {hasActiveFilters ? (
          <>
            <strong>No results for current filters</strong>
            Try removing filters or widening your search.
            <span className="dl-empty-cursor" />
            <div style={{ marginTop: 16 }}>
              <button type="button" className="dl-btn ghost" onClick={onResetFilters}>
                Clear filters
              </button>
            </div>
          </>
        ) : (
          <>
            <strong>Nothing saved here yet</strong>
            Paste a URL above to save your first bookmark.
            <span className="dl-empty-cursor" />
          </>
        )}
      </div>
    );
  }

  return (
    <div className="dl-grid">
      {bookmarks.map((bookmark) => (
        <BookmarkCard
          key={bookmark.id}
          activeTag={activeTag}
          bookmark={bookmark}
          fresh={freshId === bookmark.id}
          onDeleteRequest={onDeleteRequest}
          onEdit={onEdit}
          onTagClick={onTagClick}
        />
      ))}
    </div>
  );
}
