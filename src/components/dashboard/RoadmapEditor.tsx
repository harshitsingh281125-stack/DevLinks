import { useEffect, useRef, useState, type DragEvent, type KeyboardEvent } from "react";
import { ArrowDown, ArrowUp, ExternalLink, GripVertical, Pencil, Trash2 } from "lucide-react";
import { Favicon } from "@/components/ui/Favicon";
import { moveItem } from "@/lib/roadmap";
import { resourceTypeLabel } from "@/lib/resourceTypes";
import type { Bookmark } from "@/lib/types";
import { cn } from "@/lib/utils";

// Numbered, reorderable list of a roadmap collection's links (author view).
// Three ways to reorder: drag the grip, arrow keys on the grip, or the
// up/down buttons. Moves are batched and saved as one full order.

const COMMIT_DELAY_MS = 450;

type RoadmapEditorProps = {
  /** Already sorted by position. */
  bookmarks: Bookmark[];
  /** False while filters hide part of the collection. */
  canReorder: boolean;
  /** Step number of each bookmark within the whole collection. */
  stepNumbers: Map<string, number>;
  freshId?: string | null;
  onDeleteRequest: (bookmark: Bookmark) => void;
  onEdit: (bookmark: Bookmark) => void;
  onReorder: (orderedIds: string[]) => void;
};

export function RoadmapEditor({
  bookmarks,
  canReorder,
  stepNumbers,
  freshId,
  onDeleteRequest,
  onEdit,
  onReorder,
}: RoadmapEditorProps) {
  const incomingIds = bookmarks.map((b) => b.id);
  const incomingKey = incomingIds.join(",");
  const [order, setOrder] = useState(incomingIds);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [movedId, setMovedId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const commitTimer = useRef<ReturnType<typeof setTimeout>>();
  const pendingRef = useRef(false);
  const dragStartOrder = useRef<string[]>([]);
  const handleRefs = useRef(new Map<string, HTMLButtonElement>());
  const focusAfterMove = useRef<string | null>(null);
  // Rows are draggable, but a drag only counts if it began on the grip; the
  // browser picks the drag source at pointer-down, so this can't be state.
  const armedIdRef = useRef<string | null>(null);
  // dragover can fire before React commits the dragstart state update.
  const draggingIdRef = useRef<string | null>(null);
  // Set when the drag ends on one of our rows. dropEffect can't tell us this:
  // Safari reports "none" even after a successful drop.
  const droppedRef = useRef(false);
  const orderRef = useRef(order);
  orderRef.current = order;

  // Adopt server order unless the user has unsaved local moves in flight.
  useEffect(() => {
    if (pendingRef.current || draggingId) return;
    setOrder(incomingKey ? incomingKey.split(",") : []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomingKey]);

  useEffect(() => () => clearTimeout(commitTimer.current), []);

  useEffect(() => {
    if (!focusAfterMove.current) return;
    handleRefs.current.get(focusAfterMove.current)?.focus();
    focusAfterMove.current = null;
  }, [order]);

  useEffect(() => {
    if (!movedId) return;
    const t = setTimeout(() => setMovedId(null), 900);
    return () => clearTimeout(t);
  }, [movedId]);

  const byId = new Map(bookmarks.map((b) => [b.id, b]));
  const items = order.map((id) => byId.get(id)).filter((b): b is Bookmark => Boolean(b));

  function scheduleCommit(next: string[]) {
    pendingRef.current = true;
    clearTimeout(commitTimer.current);
    commitTimer.current = setTimeout(() => {
      pendingRef.current = false;
      onReorder(next);
    }, COMMIT_DELAY_MS);
  }

  function move(id: string, delta: number, { keepFocus = false } = {}) {
    const from = order.indexOf(id);
    const to = from + delta;
    if (from < 0 || to < 0 || to >= order.length) return;
    const next = moveItem(order, from, to);
    if (keepFocus) focusAfterMove.current = id;
    setOrder(next);
    setMovedId(id);
    setAnnouncement(`${byId.get(id)?.title ?? "Step"} moved to step ${to + 1} of ${order.length}.`);
    scheduleCommit(next);
  }

  function onHandleKeyDown(e: KeyboardEvent<HTMLButtonElement>, id: string) {
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      move(id, e.key === "ArrowUp" ? -1 : 1, { keepFocus: true });
    }
  }

  function onDragStart(e: DragEvent<HTMLLIElement>, id: string) {
    if (armedIdRef.current !== id) {
      e.preventDefault();
      return;
    }
    dragStartOrder.current = order;
    draggingIdRef.current = id;
    droppedRef.current = false;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
    // Chrome aborts a drag if the source is restyled inside dragstart, so the
    // "lifted" styling lands on the next frame.
    requestAnimationFrame(() => {
      if (draggingIdRef.current === id) setDraggingId(id);
    });
  }

  function onDragOver(e: DragEvent<HTMLLIElement>, overId: string) {
    const dragId = draggingIdRef.current;
    if (!dragId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (overId === dragId) return;
    const current = orderRef.current;
    const from = current.indexOf(dragId);
    const over = current.indexOf(overId);
    const rect = e.currentTarget.getBoundingClientRect();
    const after = e.clientY > rect.top + rect.height / 2;
    const to = from < over ? (after ? over : over - 1) : after ? over + 1 : over;
    if (to !== from) {
      const next = moveItem(current, from, to);
      orderRef.current = next;
      setOrder(next);
    }
  }

  function onDragEnd() {
    const id = draggingIdRef.current;
    draggingIdRef.current = null;
    armedIdRef.current = null;
    setDraggingId(null);
    if (!id) return;
    // Escape, or a release outside the list: put everything back.
    if (!droppedRef.current) {
      orderRef.current = dragStartOrder.current;
      setOrder(dragStartOrder.current);
      return;
    }
    const finalOrder = orderRef.current;
    if (finalOrder.join(",") !== dragStartOrder.current.join(",")) {
      setMovedId(id);
      setAnnouncement(`${byId.get(id)?.title ?? "Step"} moved to step ${finalOrder.indexOf(id) + 1} of ${finalOrder.length}.`);
      scheduleCommit(finalOrder);
    }
  }

  return (
    <>
      <p id="roadmap-help" className="sr-only">
        Use the up and down arrow keys to move this step.
      </p>
      <p className="sr-only" aria-live="assertive">
        {announcement}
      </p>

      <ol className={cn("rm-list", draggingId && "is-sorting")}>
        {items.map((bookmark, index) => {
          const step = canReorder ? index + 1 : (stepNumbers.get(bookmark.id) ?? index + 1);
          const typeLabel = resourceTypeLabel(bookmark.resourceType);
          return (
            <li
              key={bookmark.id}
              className={cn(
                "rm-row",
                draggingId === bookmark.id && "is-dragging",
                (movedId === bookmark.id || freshId === bookmark.id) && "is-moved",
              )}
              draggable={canReorder}
              onDragStart={(e) => onDragStart(e, bookmark.id)}
              onDragOver={(e) => onDragOver(e, bookmark.id)}
              onDrop={(e) => {
                // dragover is throttled (~50ms), so a quick flick can land
                // without the final position applied; apply it on drop too.
                onDragOver(e, bookmark.id);
                e.preventDefault();
                droppedRef.current = true;
              }}
              onDragEnd={onDragEnd}
            >
              {canReorder ? (
                <button
                  ref={(el) => {
                    if (el) handleRefs.current.set(bookmark.id, el);
                    else handleRefs.current.delete(bookmark.id);
                  }}
                  type="button"
                  className="rm-handle"
                  aria-label={`Reorder step ${step}: ${bookmark.title}`}
                  aria-describedby="roadmap-help"
                  onPointerDown={() => {
                    armedIdRef.current = bookmark.id;
                  }}
                  onPointerUp={() => {
                    if (!draggingId) armedIdRef.current = null;
                  }}
                  onKeyDown={(e) => onHandleKeyDown(e, bookmark.id)}
                >
                  <GripVertical size={15} strokeWidth={1.75} />
                </button>
              ) : null}

              <span className="rm-step" aria-hidden="true">
                {step}
              </span>

              <div className="rm-body">
                <div className="rm-title-row">
                  <Favicon domain={bookmark.domain} src={bookmark.faviconUrl} />
                  <h3 className="rm-title">
                    <span className="sr-only">Step {step}: </span>
                    <a href={bookmark.url} target="_blank" rel="noopener noreferrer">
                      {bookmark.title}
                    </a>
                  </h3>
                </div>
                <p className="rm-meta" translate="no">
                  {bookmark.domain}
                  {typeLabel ? <span translate="yes"> · {typeLabel}</span> : null}
                </p>
                {bookmark.description ? <p className="rm-desc">{bookmark.description}</p> : null}
              </div>

              <div className="bm-actions rm-actions">
                {canReorder ? (
                  <>
                    <button
                      type="button"
                      className="icon-btn icon-btn-sm"
                      onClick={() => move(bookmark.id, -1)}
                      disabled={index === 0}
                      aria-label={`Move ${bookmark.title} up`}
                      title="Move up"
                    >
                      <ArrowUp size={14} strokeWidth={1.75} />
                    </button>
                    <button
                      type="button"
                      className="icon-btn icon-btn-sm"
                      onClick={() => move(bookmark.id, 1)}
                      disabled={index === items.length - 1}
                      aria-label={`Move ${bookmark.title} down`}
                      title="Move down"
                    >
                      <ArrowDown size={14} strokeWidth={1.75} />
                    </button>
                  </>
                ) : null}
                <button
                  type="button"
                  className="icon-btn icon-btn-sm"
                  onClick={() => onEdit(bookmark)}
                  aria-label={`Edit ${bookmark.title}`}
                  title="Edit"
                >
                  <Pencil size={14} strokeWidth={1.75} />
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
            </li>
          );
        })}
      </ol>
    </>
  );
}
