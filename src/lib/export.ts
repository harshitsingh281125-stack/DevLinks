import type { Bookmark, Collection } from "./types";

// ─── Pure helpers (Node-safe, testable) ───────────────────────────────────────

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function serializeCollectionJson(bookmarks: Bookmark[], collection: Collection): string {
  const payload = {
    collection: { name: collection.name, description: collection.description, slug: collection.slug },
    exportedAt: new Date().toISOString(),
    bookmarks: bookmarks.map((b) => ({
      title: b.title,
      url: b.url,
      description: b.description,
      domain: b.domain,
      resourceType: b.resourceType,
      tags: b.tags,
      savedAt: b.createdAt,
    })),
  };
  return JSON.stringify(payload, null, 2);
}

export function serializeAllJson(bookmarks: Bookmark[], collections: Collection[]): string {
  const collMap = Object.fromEntries(collections.map((c) => [c.id, c.name]));
  const payload = {
    exportedAt: new Date().toISOString(),
    bookmarks: bookmarks.map((b) => ({
      title: b.title,
      url: b.url,
      description: b.description,
      domain: b.domain,
      resourceType: b.resourceType,
      tags: b.tags,
      collection: collMap[b.collectionId] ?? b.collectionId,
      savedAt: b.createdAt,
    })),
  };
  return JSON.stringify(payload, null, 2);
}

export function serializeCollectionMarkdown(bookmarks: Bookmark[], collection: Collection): string {
  const lines: string[] = [
    `# ${collection.name}`,
    "",
    collection.description ? `${collection.description}\n` : "",
    `_Exported from DevLinks on ${formatDate(new Date().toISOString())} · ${bookmarks.length} link${bookmarks.length !== 1 ? "s" : ""}_`,
    "",
    "---",
    "",
  ];

  for (const b of bookmarks) {
    lines.push(`### [${b.title}](${b.url})`);
    if (b.description) lines.push(``, b.description);
    const meta: string[] = [];
    if (b.resourceType) meta.push(`**type:** ${b.resourceType}`);
    if (b.tags.length) meta.push(`**tags:** ${b.tags.map((t) => `\`${t}\``).join(" ")}`);
    if (b.domain) meta.push(`**domain:** ${b.domain}`);
    meta.push(`**saved:** ${formatDate(b.createdAt)}`);
    lines.push("", meta.join(" · "), "");
  }

  return lines.join("\n");
}

export function serializeAllMarkdown(bookmarks: Bookmark[], collections: Collection[]): string {
  const collMap = Object.fromEntries(collections.map((c) => [c.id, c]));
  const grouped = new Map<string, Bookmark[]>();
  for (const b of bookmarks) {
    const list = grouped.get(b.collectionId) ?? [];
    list.push(b);
    grouped.set(b.collectionId, list);
  }

  const lines: string[] = [
    `# DevLinks Export`,
    "",
    `_Exported on ${formatDate(new Date().toISOString())} · ${bookmarks.length} link${bookmarks.length !== 1 ? "s" : ""} across ${grouped.size} collection${grouped.size !== 1 ? "s" : ""}_`,
    "",
    "---",
    "",
  ];

  for (const [collId, bmarks] of grouped.entries()) {
    const coll = collMap[collId];
    lines.push(`## ${coll?.name ?? "Uncategorised"}`, "");
    if (coll?.description) lines.push(coll.description, "");
    for (const b of bmarks) {
      lines.push(`- [${b.title}](${b.url})${b.description ? ` — ${b.description}` : ""}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

// ─── Download triggers (browser-only) ────────────────────────────────────────

function triggerDownload(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportCollectionJson(bookmarks: Bookmark[], collection: Collection) {
  triggerDownload(serializeCollectionJson(bookmarks, collection), `devlinks-${slugify(collection.name)}.json`, "application/json");
}

export function exportAllJson(bookmarks: Bookmark[], collections: Collection[]) {
  triggerDownload(serializeAllJson(bookmarks, collections), `devlinks-all-${formatDate(new Date().toISOString())}.json`, "application/json");
}

export function exportCollectionMarkdown(bookmarks: Bookmark[], collection: Collection) {
  triggerDownload(serializeCollectionMarkdown(bookmarks, collection), `devlinks-${slugify(collection.name)}.md`, "text/markdown");
}

export function exportAllMarkdown(bookmarks: Bookmark[], collections: Collection[]) {
  triggerDownload(serializeAllMarkdown(bookmarks, collections), `devlinks-all-${formatDate(new Date().toISOString())}.md`, "text/markdown");
}
