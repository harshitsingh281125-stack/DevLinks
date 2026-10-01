import { useCallback, useEffect, useState } from "react";
import { ArrowDown, ArrowUpRight, Check, RotateCcw } from "lucide-react";
import { Favicon } from "@/components/ui/Favicon";
import { formatCount } from "@/lib/format";
import { resourceTypeLabel } from "@/lib/resourceTypes";
import type { Bookmark } from "@/lib/types";
import { cn } from "@/lib/utils";

// Reader view of a roadmap collection: numbered steps in the author's order,
// with per-reader progress kept in this browser only (never sent anywhere).

function storageKey(collectionId: string) {
  return `devlinks:roadmap-progress:${collectionId}`;
}

function readProgress(collectionId: string): string[] {
  try {
    const raw = localStorage.getItem(storageKey(collectionId));
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function useRoadmapProgress(collectionId: string) {
  const [done, setDone] = useState<Set<string>>(() => new Set(readProgress(collectionId)));

  useEffect(() => {
    setDone(new Set(readProgress(collectionId)));
  }, [collectionId]);

  const persist = useCallback(
    (next: Set<string>) => {
      setDone(next);
      try {
        if (next.size === 0) localStorage.removeItem(storageKey(collectionId));
        else localStorage.setItem(storageKey(collectionId), JSON.stringify([...next]));
      } catch {
        // Storage unavailable (private mode): progress lasts for this visit only.
      }
    },
    [collectionId],
  );

  const toggle = useCallback(
    (id: string) => {
      const next = new Set(done);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      persist(next);
    },
    [done, persist],
  );

  const reset = useCallback(() => persist(new Set()), [persist]);

  return { done, toggle, reset };
}

export function RoadmapPath({ bookmarks, collectionId }: { bookmarks: Bookmark[]; collectionId: string }) {
  const { done, toggle, reset } = useRoadmapProgress(collectionId);
  const completed = bookmarks.filter((b) => done.has(b.id)).length;
  const nextIndex = bookmarks.findIndex((b) => !done.has(b.id));
  const allDone = bookmarks.length > 0 && nextIndex === -1;

  function jumpTo(index: number) {
    const el = document.getElementById(`step-${index + 1}`);
    el?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
    el?.querySelector<HTMLElement>(".path-open")?.focus({ preventScroll: true });
  }

  return (
    <>
      <section className="path-progress" aria-label="Your progress">
        <div className="path-progress-text">
          <p className="path-progress-count" aria-live="polite">
            {allDone
              ? "You’ve finished every step."
              : completed === 0
                ? `${formatCount(bookmarks.length, "step")}, in order.`
                : `${completed} of ${bookmarks.length} steps done`}
          </p>
          <p className="path-progress-note">Tick steps off as you go. Progress is saved in this browser only.</p>
        </div>
        <div className="path-progress-actions">
          {!allDone ? (
            <button type="button" className="btn btn-primary btn-sm" onClick={() => jumpTo(Math.max(nextIndex, 0))}>
              <ArrowDown size={14} strokeWidth={1.75} aria-hidden="true" />
              {completed === 0 ? "Start with step 1" : `Continue with step ${nextIndex + 1}`}
            </button>
          ) : null}
          {completed > 0 ? (
            <button type="button" className="btn btn-ghost btn-sm" onClick={reset}>
              <RotateCcw size={13} strokeWidth={1.75} aria-hidden="true" />
              Reset
            </button>
          ) : null}
        </div>
        <div className="path-meter" aria-hidden="true">
          {bookmarks.map((b) => (
            <span key={b.id} className={cn(done.has(b.id) && "is-done")} />
          ))}
        </div>
      </section>

      <ol className="path">
        {bookmarks.map((bookmark, index) => {
          const step = index + 1;
          const isDone = done.has(bookmark.id);
          const isNext = index === nextIndex;
          const typeLabel = resourceTypeLabel(bookmark.resourceType);
          return (
            <li
              key={bookmark.id}
              id={`step-${step}`}
              className={cn("path-step", isDone && "is-done", isNext && "is-next")}
            >
              <button
                type="button"
                role="checkbox"
                aria-checked={isDone}
                className="path-marker"
                onClick={() => toggle(bookmark.id)}
                aria-label={`Step ${step}, ${bookmark.title}: ${isDone ? "done" : "not done"}`}
              >
                {isDone ? <Check size={14} strokeWidth={2.5} /> : step}
              </button>

              <div className="path-card">
                <p className="path-kicker">
                  Step {step}
                  {isNext ? <span className="badge badge-accent">Next up</span> : null}
                </p>
                <h2 className="path-title">{bookmark.title}</h2>
                <p className="path-meta" translate="no">
                  <Favicon domain={bookmark.domain} src={bookmark.faviconUrl} />
                  {bookmark.domain}
                  {typeLabel ? <span translate="yes"> · {typeLabel}</span> : null}
                </p>
                {bookmark.description ? <p className="path-desc">{bookmark.description}</p> : null}
                {bookmark.tags.length > 0 ? (
                  <div className="bm-tags" style={{ marginTop: 12 }}>
                    {bookmark.tags.slice(0, 5).map((tag) => (
                      <span key={tag} className="tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
                <div className="path-actions">
                  <a
                    className="btn btn-secondary btn-sm path-open"
                    href={bookmark.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open link
                    <ArrowUpRight size={14} strokeWidth={1.75} aria-hidden="true" />
                  </a>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => toggle(bookmark.id)} aria-pressed={isDone}>
                    {isDone ? (
                      <>
                        <Check size={14} strokeWidth={2} aria-hidden="true" />
                        Done
                      </>
                    ) : (
                      "Mark as done"
                    )}
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </>
  );
}
