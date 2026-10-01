import { useEffect, type ReactNode } from "react";
import { Globe, Link2, MapPin, Route } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { PublicBookmarkCard } from "@/components/public/PublicBookmarkCard";
import { RoadmapPath } from "@/components/public/RoadmapPath";
import { GitHubMark, LinkedInMark, XMark } from "@/components/ui/BrandIcons";
import { Logo } from "@/components/ui/Logo";
import { ThemeSwitch } from "@/components/ui/ThemeSwitch";
import {
  useGetPublicBookmarksQuery,
  useGetPublicCollectionBySlugQuery,
  type CollectionAuthor,
} from "@/features/public/publicApi";
import { track } from "@/lib/analytics";
import { formatCount } from "@/lib/format";
import { sortByPosition } from "@/lib/roadmap";
import { buildPublicCollectionMeta } from "@/lib/seo";
import { useDocumentHead } from "@/lib/useDocumentHead";

// ─── Frame ────────────────────────────────────────────────────────────────────

function PublicFrame({ children }: { children: ReactNode }) {
  return (
    <div className="site">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="plain-header">
        <div className="plain-header-inner">
          <Link to="/" aria-label="DevLinks home">
            <Logo />
          </Link>
          <div className="plain-header-end">
            <ThemeSwitch />
            <Link to="/" className="btn btn-secondary btn-sm">
              Make your own
            </Link>
          </div>
        </div>
      </header>
      <main id="main" tabIndex={-1} style={{ flex: 1 }}>
        {children}
      </main>
    </div>
  );
}

// ─── Author ───────────────────────────────────────────────────────────────────

function authorName(author: CollectionAuthor) {
  return author.displayName ?? author.githubUsername ?? "Anonymous";
}

function AuthorAvatar({ author, size }: { author: CollectionAuthor; size: number }) {
  const name = authorName(author);
  return (
    <span className="avatar" style={{ "--avatar-size": `${size}px` } as React.CSSProperties}>
      {author.avatarUrl ? (
        <img src={author.avatarUrl} alt="" width={size} height={size} />
      ) : (
        name[0]?.toUpperCase()
      )}
    </span>
  );
}

function AuthorCard({ author }: { author: CollectionAuthor }) {
  const hasLinks =
    author.location || author.websiteUrl || author.githubUsername || author.twitterHandle || author.linkedinUrl;
  if (!author.bio && !hasLinks) return null;

  return (
    <section className="author" aria-labelledby="author-heading">
      <p id="author-heading" className="author-label">
        About the curator
      </p>
      <div className="author-top">
        <AuthorAvatar author={author} size={44} />
        <div style={{ minWidth: 0 }}>
          <p className="author-name">{authorName(author)}</p>
          {author.githubUsername ? (
            <p className="author-handle" translate="no">
              @{author.githubUsername}
            </p>
          ) : null}
          {author.bio ? <p className="author-bio">{author.bio}</p> : null}
        </div>
      </div>

      {hasLinks ? (
        <div className="author-links">
          {author.location ? (
            <span>
              <MapPin size={13} strokeWidth={1.75} aria-hidden="true" />
              {author.location}
            </span>
          ) : null}
          {author.websiteUrl ? (
            <a href={author.websiteUrl} target="_blank" rel="noopener noreferrer me" translate="no">
              <Link2 size={13} strokeWidth={1.75} aria-hidden="true" />
              {author.websiteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}
            </a>
          ) : null}
          {author.githubUsername ? (
            <a href={`https://github.com/${author.githubUsername}`} target="_blank" rel="noopener noreferrer me">
              <GitHubMark size={13} />
              GitHub
            </a>
          ) : null}
          {author.twitterHandle ? (
            <a href={`https://x.com/${author.twitterHandle}`} target="_blank" rel="noopener noreferrer me">
              <XMark size={12} />X
            </a>
          ) : null}
          {author.linkedinUrl ? (
            <a href={author.linkedinUrl} target="_blank" rel="noopener noreferrer me">
              <LinkedInMark size={13} />
              LinkedIn
            </a>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

// ─── States ───────────────────────────────────────────────────────────────────

function SkeletonRows() {
  return (
    <ul className="pub-list" aria-busy="true" aria-label="Loading links">
      {Array.from({ length: 5 }).map((_, i) => (
        <li key={i} className="pub-row">
          <div className="pub-link" aria-hidden="true">
            <span className="skeleton" style={{ width: 32, height: 32, borderRadius: 8 }} />
            <div>
              <span className="skeleton" style={{ width: "58%", height: 14, marginTop: 3 }} />
              <span className="skeleton" style={{ width: "30%", height: 11, marginTop: 9 }} />
              <span className="skeleton" style={{ width: "88%", height: 11, marginTop: 12 }} />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function LoadingState() {
  return (
    <div className="pub" aria-busy="true">
      <span className="skeleton" style={{ width: 130, height: 14 }} />
      <span className="skeleton" style={{ width: "62%", height: 36, marginTop: 16 }} />
      <span className="skeleton" style={{ width: "80%", height: 14, marginTop: 18 }} />
      <SkeletonRows />
    </div>
  );
}

function NotFoundState({ slug }: { slug: string }) {
  return (
    <div className="center-state">
      <p className="center-state-code">Not available</p>
      <h1 className="center-state-title">This collection isn’t public.</h1>
      <p className="center-state-text">
        Nothing public lives at <code translate="no">{slug}</code>. Its owner may have made it private,
        or the link may be mistyped.
      </p>
      <Link to="/" className="btn btn-secondary">
        Go to DevLinks
      </Link>
    </div>
  );
}

function CollectionContent({ collectionId, isRoadmap }: { collectionId: string; isRoadmap: boolean }) {
  const { data: bookmarks = [], isLoading, isError } = useGetPublicBookmarksQuery(collectionId);

  if (isLoading) return <SkeletonRows />;

  if (isError) {
    return (
      <div className="notice notice-danger" role="alert" style={{ marginTop: 40 }}>
        <div className="notice-body">
          <p className="notice-title">The links didn’t load</p>
          <p className="notice-text">Refresh the page to try again.</p>
        </div>
      </div>
    );
  }

  if (bookmarks.length === 0) {
    return (
      <div className="empty" style={{ marginTop: 40 }}>
        <span className="empty-icon">
          <Link2 size={18} strokeWidth={1.75} />
        </span>
        <p className="empty-title">No links yet</p>
        <p className="empty-text">The curator hasn’t added anything to this collection.</p>
      </div>
    );
  }

  if (isRoadmap) {
    return <RoadmapPath bookmarks={sortByPosition(bookmarks)} collectionId={collectionId} />;
  }

  return (
    <ul className="pub-list">
      {bookmarks.map((bookmark) => (
        <li key={bookmark.id} className="pub-row">
          <PublicBookmarkCard bookmark={bookmark} />
        </li>
      ))}
    </ul>
  );
}

function LinkCount({ collectionId, unit }: { collectionId: string; unit: "link" | "step" }) {
  const { data: bookmarks } = useGetPublicBookmarksQuery(collectionId);
  return bookmarks ? <span>{formatCount(bookmarks.length, unit)}</span> : null;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function PublicCollectionPage() {
  const { slug = "" } = useParams<{ slug: string }>();

  const {
    data: collection,
    isLoading: isCollectionLoading,
    isError: isCollectionError,
  } = useGetPublicCollectionBySlugQuery(slug, { skip: !slug });

  // Analytics: fire public_page_view once when the collection data first arrives.
  useEffect(() => {
    if (collection) {
      track({ name: "public_page_view", props: { slug, collectionId: collection.id } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collection?.id]);

  // SEO: set <title>, og:*, twitter:* and <link rel="canonical"> for this page.
  // Pass null while loading so generic DevLinks defaults are shown first, then
  // the hook updates once the collection data arrives.
  useDocumentHead(
    buildPublicCollectionMeta(isCollectionLoading || isCollectionError || !collection ? null : collection),
  );

  if (isCollectionLoading) {
    return (
      <PublicFrame>
        <LoadingState />
      </PublicFrame>
    );
  }

  // Treat a fetch error (network/RLS) the same as "not found" so we don't leak
  // whether the collection exists but is private.
  if (isCollectionError || collection === null || collection === undefined) {
    return (
      <PublicFrame>
        <NotFoundState slug={slug} />
      </PublicFrame>
    );
  }

  return (
    <PublicFrame>
      <article className="pub">
        <p className="pub-kicker">
          {collection.isRoadmap ? (
            <>
              <Route size={14} strokeWidth={1.75} aria-hidden="true" />
              Roadmap
            </>
          ) : (
            <>
              <Globe size={14} strokeWidth={1.75} aria-hidden="true" />
              Public collection
            </>
          )}
        </p>
        <h1 className="pub-title">{collection.name}</h1>
        {collection.description ? <p className="pub-desc">{collection.description}</p> : null}

        <div className="pub-byline">
          {collection.author ? (
            <>
              <AuthorAvatar author={collection.author} size={22} />
              <span>
                Curated by <strong>{authorName(collection.author)}</strong>
              </span>
              <span aria-hidden="true">·</span>
            </>
          ) : null}
          <LinkCount collectionId={collection.id} unit={collection.isRoadmap ? "step" : "link"} />
        </div>

        <CollectionContent collectionId={collection.id} isRoadmap={collection.isRoadmap} />

        {collection.author ? <AuthorCard author={collection.author} /> : null}
      </article>
    </PublicFrame>
  );
}
