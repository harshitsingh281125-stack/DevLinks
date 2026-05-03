import { BookOpen, Bookmark as BookmarkIcon, Lock } from "lucide-react";
import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { PublicBookmarkCard } from "@/components/public/PublicBookmarkCard";
import {
  useGetPublicBookmarksQuery,
  useGetPublicCollectionBySlugQuery,
  type CollectionAuthor,
} from "@/features/public/publicApi";
import { track } from "@/lib/analytics";
import { buildPublicCollectionMeta } from "@/lib/seo";
import { useDocumentHead } from "@/lib/useDocumentHead";

// ─── Author chip ──────────────────────────────────────────────────────────────

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.484 2 12.021c0 4.428 2.865 8.184 6.839 9.504.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.605-3.369-1.342-3.369-1.342-.454-1.154-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.004.07 1.532 1.032 1.532 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.026 2.747-1.026.546 1.378.203 2.397.1 2.65.64.7 1.028 1.595 1.028 2.688 0 3.848-2.338 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482C19.138 20.2 22 16.447 22 12.021 22 6.484 17.523 2 12 2z" />
    </svg>
  );
}

function AuthorSection({ author }: { author: CollectionAuthor }) {
  const name = author.displayName ?? author.githubUsername ?? "Unknown";
  const initials = name[0]?.toUpperCase() ?? "?";

  return (
    <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-5">
      {/* Avatar + name + bio */}
      <div className="flex items-start gap-4">
        <div className="shrink-0">
          {author.avatarUrl ? (
            <img
              src={author.avatarUrl}
              alt={name}
              className="h-12 w-12 rounded-full object-cover ring-1 ring-white/10"
            />
          ) : (
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-base font-semibold text-white ring-1 ring-white/10">
              {initials}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white">{name}</p>
          {author.githubUsername && (
            <p className="text-xs text-sand-200/50">@{author.githubUsername}</p>
          )}
          {author.bio && (
            <p className="mt-1.5 text-sm leading-6 text-sand-200/70">{author.bio}</p>
          )}
        </div>
      </div>

      {/* Meta row: location + links */}
      {(author.location || author.websiteUrl || author.githubUsername || author.twitterHandle || author.linkedinUrl) && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-white/8 pt-3">
          {author.location && (
            <span className="flex items-center gap-1.5 text-xs text-sand-200/50">
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 21c-4-4-7-7.5-7-11a7 7 0 0 1 14 0c0 3.5-3 7-7 11z"/><circle cx="12" cy="10" r="2"/></svg>
              {author.location}
            </span>
          )}
          {author.websiteUrl && (
            <a href={author.websiteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-cyan-300/70 transition hover:text-cyan-300">
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
              {author.websiteUrl.replace(/^https?:\/\//, "")}
            </a>
          )}
          {author.githubUsername && (
            <a href={`https://github.com/${author.githubUsername}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-sand-200/50 transition hover:text-white">
              <GitHubIcon className="h-3 w-3" />
              {author.githubUsername}
            </a>
          )}
          {author.twitterHandle && (
            <a href={`https://x.com/${author.twitterHandle}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-sand-200/50 transition hover:text-white">
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              @{author.twitterHandle}
            </a>
          )}
          {author.linkedinUrl && (
            <a href={author.linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-sand-200/50 transition hover:text-white">
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2zm2-4a2 2 0 1 1 0-4 2 2 0 0 1 0 4z"/></svg>
              LinkedIn
            </a>
          )}
        </div>
      )}
    </div>
  );
}

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
        <div>
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
          {collection.author ? (
            <AuthorSection author={collection.author} />
          ) : null}
        </div>
      </header>

      {/* Bookmarks */}
      <CollectionContent collectionId={collection.id} />
    </main>
  );
}
