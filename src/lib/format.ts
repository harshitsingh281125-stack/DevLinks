// Locale-aware formatting. Everything visible goes through Intl, never hand-built strings.

const DAY_MS = 86_400_000;

const relative = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
const shortDate = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" });
const shortDateWithYear = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  year: "numeric",
});
const integer = new Intl.NumberFormat();

/** "today", "yesterday", "5 days ago", then "Mar 4" / "Mar 4, 2025". */
export function formatSavedDate(iso: string, now: Date = new Date()): string | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;

  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOfDay(now) - startOfDay(date)) / DAY_MS);

  if (days >= 0 && days < 7) return relative.format(-days, "day");
  if (date.getFullYear() === now.getFullYear()) return shortDate.format(date);
  return shortDateWithYear.format(date);
}

export function formatCount(n: number, singular: string, plural = `${singular}s`): string {
  return `${integer.format(n)} ${n === 1 ? singular : plural}`;
}
