import { useEffect, useState } from "react";
import { Check, Copy, ExternalLink, Pencil, Trash2 } from "lucide-react";
import { Favicon } from "@/components/ui/Favicon";
import { formatSavedDate } from "@/lib/format";
import { resourceTypeLabel } from "@/lib/resourceTypes";
import type { Bookmark } from "@/lib/types";
import { cn } from "@/lib/utils";

type BookmarkCardProps = {
  activeTag?: string | null;
  bookmark: Bookmark;
  onDeleteRequest: (bookmark: Bookmark) => void;
  onEdit: (bookmark: Bookmark) => void;
  onTagClick?: (tag: string) => void;
  fresh?: boolean;
};

const MAX_VISIBLE_TAGS = 4;

export function BookmarkCard({
  activeTag,
  bookmark,
  onDeleteRequest,
  onEdit,
  onTagClick,
  fresh = false,
}: BookmarkCardProps) {
  const [copied, setCopied] = useState(false);
  const visibleTags = bookmark.tags.slice(0, MAX_VISIBLE_TAGS);
  const overflowCount = bookmark.tags.length - MAX_VISIBLE_TAGS;
  const savedDate = formatSavedDate(bookmark.createdAt);
  const typeLabel = resourceTypeLabel(bookmark.resourceType);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(t);
  }, [copied]);

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(bookmark.url);
      setCopied(true);
    } catch {
      // Clipboard can be blocked (permissions, insecure origin); the URL is still one click away.
    }
  }

  return (
    <article className={cn("bm-card", fresh && "is-fresh")}>
      <div className="bm-top">
        <Favicon domain={bookmark.domain} src={bookmark.faviconUrl} />
        <span className="bm-domain" translate="no">
          {bookmark.domain}
          {typeLabel ? <span translate="yes"> · {typeLabel}</span> : null}
        </span>

        <div className="bm-actions">
          <button
            type="button"
            className="icon-btn icon-btn-sm"
            onClick={() => onEdit(bookmark)}
            aria-label={`Edit ${bookmark.title}`}
            title="Edit"
          >
            <Pencil size={14} strokeWidth={1.75} />
          </button>
          <button
            type="button"
            className="icon-btn icon-btn-sm"
            onClick={() => void copyUrl()}
            aria-label={copied ? "Link copied" : "Copy link"}
            title={copied ? "Copied" : "Copy link"}
          >
            {copied ? <Check size={14} strokeWidth={2} /> : <Copy size={14} strokeWidth={1.75} />}
          </button>
          <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            className="icon-btn icon-btn-sm"
            aria-label={`Open ${bookmark.title} in a new tab`}
            title="Open in new tab"
          >
            <ExternalLink size={14} strokeWidth={1.75} />
          </a>
          <button
            type="button"
            className="icon-btn icon-btn-sm is-danger"
            onClick={() => onDeleteRequest(bookmark)}
            aria-label={`Delete ${bookmark.title}`}
            title="Delete"
          >
            <Trash2 size={14} strokeWidth={1.75} />
          </button>
        </div>
      </div>

      <h3 className="bm-title">
        <a href={bookmark.url} target="_blank" rel="noopener noreferrer">
          {bookmark.title}
        </a>
      </h3>

      {bookmark.description ? <p className="bm-desc">{bookmark.description}</p> : null}

      <div className="bm-foot">
        <div className="bm-tags">
          {visibleTags.map((tag) =>
            onTagClick ? (
              <button
                key={tag}
                type="button"
                className="tag"
                onClick={() => onTagClick(tag)}
                aria-pressed={activeTag === tag}
                title={activeTag === tag ? `Clear the “${tag}” filter` : `Show only “${tag}”`}
              >
                {tag}
              </button>
            ) : (
              <span key={tag} className="tag">
                {tag}
              </span>
            ),
          )}
          {overflowCount > 0 ? (
            <span className="tag" title={bookmark.tags.slice(MAX_VISIBLE_TAGS).join(", ")}>
              +{overflowCount}
            </span>
          ) : null}
        </div>
        {savedDate ? (
          <time className="bm-date" dateTime={bookmark.createdAt}>
            {savedDate}
          </time>
        ) : null}
      </div>
    </article>
  );
}
