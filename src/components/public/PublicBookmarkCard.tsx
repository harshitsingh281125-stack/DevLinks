import { ExternalLink } from "lucide-react";
import type { Bookmark } from "@/lib/types";

const RESOURCE_TYPE_COLORS: Record<string, string> = {
  article: "bg-blue-400/15 text-blue-300 border-blue-400/20",
  video: "bg-red-400/15 text-red-300 border-red-400/20",
  repo: "bg-emerald-400/15 text-emerald-300 border-emerald-400/20",
  documentation: "bg-violet-400/15 text-violet-300 border-violet-400/20",
  tool: "bg-amber-400/15 text-amber-300 border-amber-400/20",
  course: "bg-indigo-400/15 text-indigo-300 border-indigo-400/20",
  podcast: "bg-pink-400/15 text-pink-300 border-pink-400/20",
  other: "bg-white/10 text-sand-300 border-white/10",
};

function resourceTypeColor(type: string | null): string {
  return RESOURCE_TYPE_COLORS[type ?? "other"] ?? RESOURCE_TYPE_COLORS.other;
}

const MAX_VISIBLE_TAGS = 5;

type PublicBookmarkCardProps = {
  bookmark: Bookmark;
};

export function PublicBookmarkCard({ bookmark }: PublicBookmarkCardProps) {
  const visibleTags = bookmark.tags.slice(0, MAX_VISIBLE_TAGS);
  const overflowCount = bookmark.tags.length - MAX_VISIBLE_TAGS;

  return (
    <article className="group relative rounded-[1.5rem] border border-white/10 bg-white/5 p-4 transition hover:border-white/20 hover:bg-white/[0.08]">
      {/* Header: favicon + domain + resource type badge + external link */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {bookmark.faviconUrl ? (
            <img
              src={bookmark.faviconUrl}
              alt=""
              width={16}
              height={16}
              className="h-4 w-4 shrink-0 rounded object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          ) : null}
          {bookmark.domain ? (
            <span className="truncate text-xs text-sand-200/60">{bookmark.domain}</span>
          ) : null}
          {bookmark.resourceType ? (
            <span
              className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${resourceTypeColor(bookmark.resourceType)}`}
            >
              {bookmark.resourceType}
            </span>
          ) : null}
        </div>

        {/* External link — visible on hover or keyboard focus */}
        <a
          href={bookmark.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open in new tab"
          className="shrink-0 rounded-full border border-white/10 bg-white/5 p-1.5 text-sand-200/60 opacity-0 transition hover:bg-white/10 hover:text-white group-hover:opacity-100 focus:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-1 focus-visible:ring-offset-ink-950"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      {/* Title as external link */}
      <a
        href={bookmark.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 block text-base font-semibold leading-snug text-white transition hover:text-cyan-300"
      >
        {bookmark.title}
      </a>

      {/* Description */}
      {bookmark.description ? (
        <p className="mt-1.5 line-clamp-2 text-sm leading-6 text-sand-200/65">
          {bookmark.description}
        </p>
      ) : null}

      {/* Tags — display only */}
      {visibleTags.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {visibleTags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-0.5 text-xs font-medium text-cyan-200"
            >
              {tag}
            </span>
          ))}
          {overflowCount > 0 ? (
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-sand-300/60">
              +{overflowCount}
            </span>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
