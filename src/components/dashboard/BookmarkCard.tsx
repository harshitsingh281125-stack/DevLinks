import { Copy, ExternalLink, Pencil, Trash2 } from "lucide-react";
import type { Bookmark } from "@/lib/types";

type BookmarkCardProps = {
  activeTag?: string | null;
  bookmark: Bookmark;
  onDeleteRequest: (bookmark: Bookmark) => void;
  onEdit: (bookmark: Bookmark) => void;
  onTagClick?: (tag: string) => void;
  fresh?: boolean;
};

const MAX_VISIBLE_TAGS = 5;

export function BookmarkCard({
  activeTag,
  bookmark,
  onDeleteRequest,
  onEdit,
  onTagClick,
  fresh = false,
}: BookmarkCardProps) {
  const visibleTags = bookmark.tags.slice(0, MAX_VISIBLE_TAGS);
  const overflowCount = bookmark.tags.length - MAX_VISIBLE_TAGS;

  // Format "added N days ago" from createdAt
  const daysAgo = (() => {
    try {
      const diff = Date.now() - new Date(bookmark.createdAt).getTime();
      const d = Math.floor(diff / 86_400_000);
      return d === 0 ? "today" : `${d}d ago`;
    } catch {
      return null;
    }
  })();

  // Favicon: try real faviconUrl, fall back to first char of domain
  const faviconLetter = bookmark.domain?.[0]?.toUpperCase() ?? "?";

  return (
    <article className={`dl-bookmark${fresh ? " fresh" : ""}`}>
      {/* Top row: favicon + domain/type + action buttons */}
      <div className="dl-bookmark-top">
        <div className="dl-favicon">
          {bookmark.faviconUrl ? (
            <img
              src={bookmark.faviconUrl}
              alt=""
              onError={(e) => {
                const img = e.currentTarget as HTMLImageElement;
                img.style.display = "none";
                // Show letter fallback by revealing a sibling span
                const span = img.nextElementSibling as HTMLElement | null;
                if (span) span.style.display = "block";
              }}
            />
          ) : null}
          <span style={{ display: bookmark.faviconUrl ? "none" : "block" }}>
            {faviconLetter}
          </span>
        </div>

        <div className="dl-bm-info">
          <span className="dl-bm-domain">{bookmark.domain}</span>
          {bookmark.resourceType ? (
            <span className="dl-bm-type">{bookmark.resourceType}</span>
          ) : null}
        </div>

        {/* Action buttons — appear on hover */}
        <div className="dl-bm-actions">
          <button
            type="button"
            className="dl-bm-action-btn"
            onClick={() => onEdit(bookmark)}
            aria-label="Edit bookmark"
          >
            <Pencil size={12} />
          </button>
          <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            className="dl-bm-action-btn"
            aria-label="Open in new tab"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink size={12} />
          </a>
          <button
            type="button"
            className="dl-bm-action-btn"
            onClick={() => void navigator.clipboard.writeText(bookmark.url)}
            aria-label="Copy URL"
          >
            <Copy size={12} />
          </button>
          <button
            type="button"
            className="dl-bm-action-btn delete"
            onClick={() => onDeleteRequest(bookmark)}
            aria-label="Delete bookmark"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Title */}
      <h3>
        <a
          href={bookmark.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "inherit", textDecoration: "none" }}
        >
          {bookmark.title}
        </a>
      </h3>

      {/* Description */}
      {bookmark.description ? <p>{bookmark.description}</p> : null}

      {/* Tags */}
      {visibleTags.length > 0 ? (
        <div className="dl-bm-tags">
          {visibleTags.map((tag) => {
            const isActive = activeTag === tag;
            if (onTagClick) {
              return (
                <button
                  key={tag}
                  type="button"
                  className={`dl-tag${isActive ? " active" : ""}`}
                  onClick={() => onTagClick(tag)}
                  aria-pressed={isActive}
                  aria-label={`Filter by tag: ${tag}`}
                >
                  {tag}
                </button>
              );
            }
            return (
              <span key={tag} className="dl-tag">
                {tag}
              </span>
            );
          })}
          {overflowCount > 0 ? (
            <span className="dl-tag" style={{ opacity: 0.6 }}>
              +{overflowCount}
            </span>
          ) : null}
        </div>
      ) : null}

      {/* Meta footer */}
      <div className="dl-bm-meta">
        {daysAgo ? <span>added {daysAgo}</span> : <span />}
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "55%", textAlign: "right" }}>
          {bookmark.url.length > 38 ? bookmark.url.slice(0, 38) + "…" : bookmark.url}
        </span>
      </div>
    </article>
  );
}
