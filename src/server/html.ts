// Minimal, dependency-free HTML helpers for metadata extraction. Regex-based on
// purpose: we only read <meta>, <script type="application/ld+json">, and a few
// link patterns from untrusted pages, and never build a DOM from them.

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  quot: '"',
  apos: "'",
  lt: "<",
  gt: ">",
  nbsp: " ",
  ndash: "-",
  mdash: "-",
  hellip: "…",
  rsquo: "’",
  lsquo: "‘",
  rdquo: "”",
  ldquo: "“",
};

export function decodeHtml(value: string): string {
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
    if (entity[0] === "#") {
      const code = entity[1] === "x" || entity[1] === "X" ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : match;
    }
    return NAMED_ENTITIES[entity.toLowerCase()] ?? match;
  });
}

const ATTRIBUTE = /([^\s=/>"']+)\s*(?:=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;

/** Attributes of an opening tag's inner text, lower-cased names, decoded values. */
export function parseAttributes(tagInner: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  for (const match of tagInner.matchAll(ATTRIBUTE)) {
    const name = match[1].toLowerCase();
    if (name in attrs) continue;
    attrs[name] = decodeHtml(match[2] ?? match[3] ?? match[4] ?? "");
  }
  return attrs;
}

export type MetaTag = Record<string, string>;

/** Every <meta> tag in the document, in order. Quote-aware, so apostrophes survive. */
export function parseMetaTags(html: string): MetaTag[] {
  const tags: MetaTag[] = [];
  for (const match of html.matchAll(/<meta\b([^>]*)>/gi)) {
    tags.push(parseAttributes(match[1]));
  }
  return tags;
}

function hasKey(tag: MetaTag, key: string) {
  return tag.name?.toLowerCase() === key || tag.property?.toLowerCase() === key;
}

/** Every non-empty content for <meta name|property="key">, in document order. */
export function metaContents(tags: MetaTag[], key: string): string[] {
  const lower = key.toLowerCase();
  return tags
    .filter((tag) => hasKey(tag, lower))
    .map((tag) => tag.content?.trim() ?? "")
    .filter(Boolean);
}

/** First non-empty content for <meta name|property="key">. */
export function metaContent(tags: MetaTag[], key: string): string | null {
  return metaContents(tags, key)[0] ?? null;
}

/** Parsed bodies of every <script type="application/ld+json">; invalid JSON is skipped. */
export function parseJsonLd(html: string): unknown[] {
  const blocks: unknown[] = [];
  for (const match of html.matchAll(/<script\b[^>]*type\s*=\s*["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      blocks.push(JSON.parse(match[1].trim()));
    } catch {
      // Malformed JSON-LD is common; ignore it rather than fail the preview.
    }
  }
  return blocks;
}

export function stripTags(value: string): string {
  return decodeHtml(value.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
}
