import { useMemo } from "react";
import { Search, X } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { CollectionFeed } from "@/components/public/CollectionFeed";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useGetPublicFeedQuery, type PublicFeedItem } from "@/features/public/publicApi";
import { formatCount } from "@/lib/format";
import { useDocumentHead } from "@/lib/useDocumentHead";
import { buildPublicCollectionMeta } from "@/lib/seo";

const NAV = [
  { href: "/explore", label: "Explore" },
  { href: "/#how", label: "How it works" },
  { href: "/#faq", label: "FAQ" },
];

type Sort = "recent" | "links";

const EXPLORE_TITLE = "Public collections · DevLinks";
const SITE_META = buildPublicCollectionMeta(null);
const EXPLORE_META = {
  ...SITE_META,
  canonical: `${SITE_META.canonical}/explore`,
  ogUrl: `${SITE_META.ogUrl}/explore`,
  title: EXPLORE_TITLE,
  ogTitle: EXPLORE_TITLE,
  twitterTitle: EXPLORE_TITLE,
};

function matches(item: PublicFeedItem, query: string) {
  const haystack = [
    item.collection.name,
    item.collection.description,
    item.author?.displayName,
    item.author?.githubUsername,
    ...item.sites.map((s) => s.domain),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((token) => haystack.includes(token));
}

export function ExplorePage() {
  const [params, setParams] = useSearchParams();
  const query = params.get("q") ?? "";
  const sort: Sort = params.get("sort") === "links" ? "links" : "recent";
  const { data = [], isLoading, isError } = useGetPublicFeedQuery();

  useDocumentHead(EXPLORE_META);

  function update(key: "q" | "sort", value: string | null) {
    const next = new URLSearchParams(window.location.search);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  }

  const items = useMemo(() => {
    const filtered = query.trim() ? data.filter((item) => matches(item, query)) : data;
    return sort === "links" ? [...filtered].sort((a, b) => b.linkCount - a.linkCount) : filtered;
  }, [data, query, sort]);

  return (
    <SiteLayout nav={NAV}>
      <div className="container" style={{ paddingTop: 64 }}>
        <h1 className="display" style={{ fontSize: "clamp(36px, 5vw, 52px)" }}>
          Public collections
        </h1>
        <p className="body-lg" style={{ marginTop: 14 }}>
          Reading lists people chose to share. Open any of them without an account.
        </p>

        <div className="explore-toolbar">
          <div className="search" role="search">
            <Search className="search-icon" size={15} strokeWidth={1.75} aria-hidden="true" />
            <input
              className="input"
              type="search"
              name="q"
              autoComplete="off"
              spellCheck={false}
              placeholder="Search by topic, curator, or site…"
              value={query}
              onChange={(e) => update("q", e.target.value || null)}
              aria-label="Search public collections"
            />
            {query ? (
              <div className="search-end">
                <button type="button" className="icon-btn icon-btn-sm" onClick={() => update("q", null)} aria-label="Clear search">
                  <X size={14} strokeWidth={1.75} />
                </button>
              </div>
            ) : null}
          </div>

          <div className="seg" role="group" aria-label="Sort collections">
            <button type="button" className="seg-item" aria-pressed={sort === "recent"} onClick={() => update("sort", null)}>
              Recently updated
            </button>
            <button type="button" className="seg-item" aria-pressed={sort === "links"} onClick={() => update("sort", "links")}>
              Most links
            </button>
          </div>

          {!isLoading && !isError ? (
            <span className="explore-count" aria-live="polite">
              {formatCount(items.length, "collection")}
            </span>
          ) : null}
        </div>

        <CollectionFeed
          items={items}
          isLoading={isLoading}
          isError={isError}
          {...(query && data.length > 0
            ? {
                emptyTitle: `Nothing matches “${query}”`,
                emptyText: "Try a broader topic, or search for a site like react.dev.",
              }
            : {})}
        />
      </div>
    </SiteLayout>
  );
}
