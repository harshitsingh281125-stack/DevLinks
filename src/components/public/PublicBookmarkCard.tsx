import { ArrowUpRight } from "lucide-react";
import { Favicon } from "@/components/ui/Favicon";
import { resourceTypeLabel } from "@/lib/resourceTypes";
import type { Bookmark } from "@/lib/types";

const MAX_VISIBLE_TAGS = 5;

/** One row of a public reading list. The whole row opens the link. */
export function PublicBookmarkCard({ bookmark }: { bookmark: Bookmark }) {
  const typeLabel = resourceTypeLabel(bookmark.resourceType);
  const visibleTags = bookmark.tags.slice(0, MAX_VISIBLE_TAGS);
  const overflowCount = bookmark.tags.length - MAX_VISIBLE_TAGS;

  return (
    <a className="pub-link" href={bookmark.url} target="_blank" rel="noopener noreferrer">
      <Favicon domain={bookmark.domain} src={bookmark.faviconUrl} />
      <div style={{ minWidth: 0 }}>
        <h2 className="pub-link-title">{bookmark.title}</h2>
        <p className="pub-link-meta" translate="no">
          {bookmark.domain}
          {typeLabel ? <span translate="yes"> · {typeLabel}</span> : null}
        </p>
        {bookmark.description ? <p className="pub-link-desc">{bookmark.description}</p> : null}
        {visibleTags.length > 0 ? (
          <div className="bm-tags">
            {visibleTags.map((tag) => (
              <span key={tag} className="tag">
                {tag}
              </span>
            ))}
            {overflowCount > 0 ? <span className="tag">+{overflowCount}</span> : null}
          </div>
        ) : null}
      </div>
      <ArrowUpRight className="pub-link-arrow" size={16} strokeWidth={1.75} aria-hidden="true" />
    </a>
  );
}
