import type { Bookmark } from "./types";

/** Roadmap order: position ascending, oldest first when positions tie. */
export function sortByPosition<T extends Pick<Bookmark, "position" | "createdAt">>(items: T[]): T[] {
  return [...items].sort((a, b) => a.position - b.position || a.createdAt.localeCompare(b.createdAt));
}

/** Returns a copy of `list` with the item at `from` moved to index `to`. */
export function moveItem<T>(list: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || from >= list.length) return list.slice();
  const target = Math.max(0, Math.min(list.length - 1, to));
  const next = list.slice();
  const [item] = next.splice(from, 1);
  next.splice(target, 0, item);
  return next;
}
