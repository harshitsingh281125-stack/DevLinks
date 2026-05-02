import { BookOpen, Bookmark as BookmarkIcon, Lock } from "lucide-react";
import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { PublicBookmarkCard } from "@/components/public/PublicBookmarkCard";
import {
  useGetPublicBookmarksQuery,
  useGetPublicCollectionBySlugQuery,
} from "@/features/public/publicApi";
import { track } from "@/lib/analytics";
import { buildPublicCollectionMeta } from "@/lib/seo";
import { useDocumentHead } from "@/lib/useDocumentHead";

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
      <div className="flex items-center gap-2">
        <div className="h-4 w-20 animate-pulse rounded-full bg-white/10" />
        <div className="h-4 w-14 animate-pulse rounded-full bg-white/10" />
      </div>
      <div className="mt-3 h-5 w-3/4 animate-pulse rounded-full bg-white/10" />
      <div className="mt-2 h-4 w-full animate-pulse rounded-full bg-white/10" />
      <div className="mt-1 h-4 w-2/3 animate-pulse rounded-full bg-white/10" />
      <div className="mt-3 flex gap-1.5">
        <div className="h-5 w-14 animate-pulse rounded-full bg-white/10" />
        <div className="h-5 w-10 animate-pulse rounded-full bg-white/10" />
      </div>
    </div>
  );
}

// ─── Collection loading skeleton ──────────────────────────────────────────────

function LoadingState() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-16">
      {/* Header skeleton */}
      <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-panel backdrop-blur">
        <div className="h-4 w-24 animate-pulse rounded-full bg-white/10" />
        <div className="mt-4 h-8 w-64 animate-pulse rounded-full bg-white/10" />
        <div className="mt-3 h-4 w-full max-w-md animate-pulse rounded-full bg-white/10" />
        <div className="mt-2 h-4 w-48 animate-pulse rounded-full bg-white/10" />
      </div>

      {/* Cards skeleton */}
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </main>
  );
}

// ─── Not-found / private state ────────────────────────────────────────────────

function NotFoundState({ slug }: { slug: string }) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-4">
      <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center shadow-panel backdrop-blur">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-white/5">
          <Lock className="h-6 w-6 text-sand-300/60" />
        </div>
        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.28em] text-sand-300/60">
          Not found
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-white">
          Collection not available
        </h1>
        <p className="mt-4 text-sm leading-7 text-sand-200/65">
          <code className="rounded-md bg-white/10 px-1.5 py-0.5 text-xs font-mono text-cyan-200">
            {slug}
          </code>{" "}
          doesn't match any public collection. It may have been made private or the link
          may be incorrect.
        </p>
        <Link
          to="/"
          className="mt-8 inline-flex rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-ink-950 transition hover:bg-cyan-300"
        >
          Back to DevLinks
        </Link>
      </div>
    </main>
  );
}

// ─── Empty collection state ───────────────────────────────────────────────────

function EmptyBookmarksState() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-[1.5rem] border border-dashed border-white/15 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-cyan-400/10 text-cyan-300">
        <BookmarkIcon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-base font-semibold text-white">No bookmarks yet</p>
        <p className="mt-1 text-sm text-sand-200/60">
          The owner hasn't added any links to this collection.
        </p>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

function CollectionContent({ collectionId }: { collectionId: string }) {
  const { data: bookmarks = [], isLoading, isError } = useGetPublicBookmarksQuery(collectionId);

  if (isLoading) {
    return (
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <p className="mt-8 text-sm text-rose-300">
        Bookmarks could not be loaded. Please try refreshing the page.
      </p>
    );
  }

  if (bookmarks.length === 0) {
    return <div className="mt-8"><EmptyBookmarksState /></div>;
  }

  return (
    <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {bookmarks.map((bookmark) => (
        <PublicBookmarkCard key={bookmark.id} bookmark={bookmark} />
      ))}
    </div>
  );
}

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
    buildPublicCollectionMeta(
      isCollectionLoading || isCollectionError || !collection ? null : collection,
    ),
  );

  // Show loading skeleton while the collection query is in flight
  if (isCollectionLoading) {
    return <LoadingState />;
  }

  // Treat a fetch error (network/RLS) the same as "not found" — don't leak
  // information about whether the collection exists but is private.
  if (isCollectionError || collection === null || collection === undefined) {
    return <NotFoundState slug={slug} />;
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-16">
      {/* Collection header */}
      <header className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-panel backdrop-blur">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
                <BookOpen className="h-4 w-4" />
              </span>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300">
                Public collection
              </p>
            </div>
            <h1 className="mt-4 text-4xl font-semibold text-white">
              {collection.name}
            </h1>
            {collection.description ? (
              <p className="mt-3 max-w-2xl text-base leading-7 text-sand-200/75">
                {collection.description}
              </p>
            ) : null}
          </div>

          {/* DevLinks attribution */}
          <div className="shrink-0">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-sand-200/70 transition hover:bg-white/10 hover:text-white"
            >
              Shared via DevLinks
            </Link>
          </div>
        </div>
      </header>

      {/* Bookmarks */}
      <CollectionContent collectionId={collection.id} />
    </main>
  );
}
