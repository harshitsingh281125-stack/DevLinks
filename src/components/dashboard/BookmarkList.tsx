import { Link2, SearchX, TriangleAlert } from "lucide-react";
import type { Bookmark } from "@/lib/types";
import { BookmarkCard } from "./BookmarkCard";
import { RoadmapEditor } from "./RoadmapEditor";

type BookmarkListProps = {
  activeTag?: string | null;
  bookmarks: Bookmark[];
  hasActiveFilters: boolean;
  isError?: boolean;
  isLoading: boolean;
  onDeleteRequest: (bookmark: Bookmark) => void;
  onEdit: (bookmark: Bookmark) => void;
  onFocusSaveBar: () => void;
  onResetFilters: () => void;
  onTagClick: (tag: string) => void;
  freshId?: string | null;
  /** When set, the collection is a roadmap: render ordered, reorderable steps. */
  roadmap?: {
    canReorder: boolean;
    stepNumbers: Map<string, number>;
    onReorder: (orderedIds: string[]) => void;
  };
};

function SkeletonCard() {
  return (
    <div className="bm-card bm-skeleton" aria-hidden="true">
      <div className="bm-top">
        <span className="skeleton" style={{ width: 24, height: 24 }} />
        <span className="skeleton" style={{ width: "38%", height: 10 }} />
      </div>
      <span className="skeleton" style={{ width: "86%", height: 13, marginTop: 14 }} />
      <span className="skeleton" style={{ width: "62%", height: 13, marginTop: 8 }} />
      <span className="skeleton" style={{ width: "92%", height: 10, marginTop: 12 }} />
      <div style={{ display: "flex", gap: 4, marginTop: 18 }}>
        <span className="skeleton" style={{ width: 46, height: 22 }} />
        <span className="skeleton" style={{ width: 58, height: 22 }} />
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
  onFocusSaveBar,
  onResetFilters,
  onTagClick,
  freshId,
  roadmap,
}: BookmarkListProps) {
  if (isLoading) {
    return (
      <div className="bm-grid" aria-busy="true" aria-label="Loading bookmarks">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="empty" role="alert">
        <span className="empty-icon">
          <TriangleAlert size={18} strokeWidth={1.75} />
        </span>
        <p className="empty-title">Bookmarks didn’t load</p>
        <p className="empty-text">The request to the database failed. Refresh the page to try again.</p>
        <div className="empty-actions">
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => window.location.reload()}>
            Refresh
          </button>
        </div>
      </div>
    );
  }

  if (bookmarks.length === 0) {
    return hasActiveFilters ? (
      <div className="empty">
        <span className="empty-icon">
          <SearchX size={18} strokeWidth={1.75} />
        </span>
        <p className="empty-title">No bookmarks match these filters</p>
        <p className="empty-text">Try a shorter search, or clear the type and tag filters.</p>
        <div className="empty-actions">
          <button type="button" className="btn btn-secondary btn-sm" onClick={onResetFilters}>
            Clear filters
          </button>
        </div>
      </div>
    ) : (
      <div className="empty">
        <span className="empty-icon">
          <Link2 size={18} strokeWidth={1.75} />
        </span>
        <p className="empty-title">This collection is empty</p>
        <p className="empty-text">
          Paste a link into the bar above. DevLinks fetches the title and description, then suggests a
          type and tags for you to review.
        </p>
        <div className="empty-actions">
          <button type="button" className="btn btn-secondary btn-sm" onClick={onFocusSaveBar}>
            Save a link
          </button>
        </div>
      </div>
    );
  }

  if (roadmap) {
    return (
      <RoadmapEditor
        bookmarks={bookmarks}
        canReorder={roadmap.canReorder}
        stepNumbers={roadmap.stepNumbers}
        freshId={freshId}
        onDeleteRequest={onDeleteRequest}
        onEdit={onEdit}
        onReorder={roadmap.onReorder}
      />
    );
  }

  return (
    <div className="bm-grid">
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
