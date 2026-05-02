import type { MetadataPreview } from "@/lib/types";

export function normalizeUrl(input: string) {
  const parsedUrl = new URL(input);
  const pathname = parsedUrl.pathname.replace(/\/+$/, "");
  const search = parsedUrl.search;

  return `${parsedUrl.origin}${pathname}${search}`.toLowerCase();
}

export function buildDraftMetadataPreview(input: string): MetadataPreview {
  const parsedUrl = new URL(input);
  const normalizedUrl = normalizeUrl(input);
  const pathname = parsedUrl.pathname === "/" ? "" : parsedUrl.pathname;
  const lastPathSegment = pathname
    .split("/")
    .filter(Boolean)
    .slice(-1)[0];
  const inferredTitle = pathname
    ? pathname
        .split("/")
        .filter(Boolean)
        .slice(-1)[0]
        ?.replace(/[-_]+/g, " ")
        .replace(/\b\w/g, (character: string) => character.toUpperCase()) ?? null
    : parsedUrl.hostname.replace(/^www\./, "");

  return {
    url: parsedUrl.toString(),
    normalizedUrl,
    title: inferredTitle ?? lastPathSegment ?? null,
    description: "Draft preview generated locally. Server-side metadata extraction lands in the next task.",
    domain: parsedUrl.hostname.replace(/^www\./, ""),
    faviconUrl: null,
    imageUrl: null,
    resourceType: null,
    suggestedTags: [],
    fetchStatus: "partial",
  };
}
