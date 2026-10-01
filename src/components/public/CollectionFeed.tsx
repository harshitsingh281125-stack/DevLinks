import { ArrowUpRight, Library } from "lucide-react";
import { Link } from "react-router-dom";
import { Favicon } from "@/components/ui/Favicon";
import type { PublicFeedItem } from "@/features/public/publicApi";
import { formatCount, formatSavedDate } from "@/lib/format";

function curatorName(author: PublicFeedItem["author"]) {
  return author?.displayName ?? author?.githubUsername ?? null;
}

function FeedRow({ item }: { item: PublicFeedItem }) {
  const { collection, author, linkCount, sites, lastActivityAt } = item;
  const name = curatorName(author);
  const updated = formatSavedDate(lastActivityAt);

  return (
    <Link className="feed-link" to={`/public/collections/${collection.slug}`}>
      <span className="feed-sites" aria-hidden="true">
        {sites.length > 0 ? (
          sites.map((site) => <Favicon key={site.domain} domain={site.domain} src={site.faviconUrl} />)
        ) : (
          <span className="favicon">
            <Library size={14} strokeWidth={1.75} />
          </span>
        )}
      </span>
      <span className="feed-body">
        <span className="feed-title">{collection.name}</span>
        {collection.description ? <span className="feed-desc">{collection.description}</span> : null}
        <span className="feed-meta">
          {name ? (
            <span className="feed-curator">
              <span className="avatar" style={{ "--avatar-size": "18px" } as React.CSSProperties}>
                {author?.avatarUrl ? <img src={author.avatarUrl} alt="" width={18} height={18} loading="lazy" /> : name[0]?.toUpperCase()}
              </span>
              {name}
            </span>
          ) : null}
          <span>{collection.isRoadmap ? `Roadmap · ${formatCount(linkCount, "step")}` : formatCount(linkCount, "link")}</span>
          {updated ? (
            <time dateTime={lastActivityAt}>Updated {updated}</time>
          ) : null}
        </span>
      </span>
      <ArrowUpRight className="feed-arrow" size={16} strokeWidth={1.75} aria-hidden="true" />
    </Link>
  );
}

function SkeletonRow() {
  return (
    <li className="feed-row" aria-hidden="true">
      <div className="feed-link" style={{ pointerEvents: "none" }}>
        <span className="skeleton" style={{ width: 52, height: 28 }} />
        <span className="feed-body">
          <span className="skeleton" style={{ width: "40%", height: 15 }} />
          <span className="skeleton" style={{ width: "76%", height: 12, marginTop: 10 }} />
          <span className="skeleton" style={{ width: "32%", height: 11, marginTop: 12 }} />
        </span>
      </div>
    </li>
  );
}

type CollectionFeedProps = {
  items: PublicFeedItem[];
  isLoading: boolean;
  isError: boolean;
  /** Shown when there are no public collections at all. */
  emptyTitle?: string;
  emptyText?: string;
};

export function CollectionFeed({
  items,
  isLoading,
  isError,
  emptyTitle = "No public collections yet",
  emptyText = "When someone shares a collection, it shows up here.",
}: CollectionFeedProps) {
  if (isLoading) {
    return (
      <ul className="feed" aria-busy="true" aria-label="Loading public collections">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </ul>
    );
  }

  if (isError) {
    return (
      <div className="notice notice-danger" role="alert">
        <div className="notice-body">
          <p className="notice-title">Public collections didn’t load</p>
          <p className="notice-text">Refresh the page to try again.</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="empty">
        <span className="empty-icon">
          <Library size={18} strokeWidth={1.75} />
        </span>
        <p className="empty-title">{emptyTitle}</p>
        <p className="empty-text">{emptyText}</p>
      </div>
    );
  }

  return (
    <ul className="feed">
      {items.map((item) => (
        <li key={item.collection.id} className="feed-row">
          <FeedRow item={item} />
        </li>
      ))}
    </ul>
  );
}
