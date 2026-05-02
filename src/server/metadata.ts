import { lookup } from "node:dns/promises";
import type { IncomingHttpHeaders } from "node:http";
import type { MetadataPreview, MetadataFetchStatus } from "../lib/types";
import { inferResourceType, inferSuggestedTags } from "./taggingRules";

const REQUEST_TIMEOUT_MS = 8_000;
const MAX_REDIRECTS = 5;

type MetadataRequestBody = {
  url?: unknown;
};

type MetadataResponseBody = MetadataPreview;

type FetchResult = {
  finalUrl: URL;
  html: string;
  response: Response;
};

type ServerRequestLike = {
  body?: unknown;
  headers?: IncomingHttpHeaders | Headers;
  method?: string;
};

type ServerResponseLike = {
  status: (code: number) => ServerResponseLike;
  json: (body: MetadataResponseBody | { error: string; fetchStatus: MetadataFetchStatus }) => void;
  setHeader?: (name: string, value: string) => void;
};

function createMetadataPreview(
  inputUrl: URL,
  overrides: Partial<MetadataPreview>,
): MetadataPreview {
  const normalizedUrl = normalizeUrl(inputUrl);

  return {
    url: inputUrl.toString(),
    normalizedUrl,
    title: null,
    description: null,
    domain: inputUrl.hostname.replace(/^www\./, ""),
    faviconUrl: null,
    imageUrl: null,
    resourceType: null,
    suggestedTags: [],
    fetchStatus: "partial",
    ...overrides,
  };
}

function normalizeUrl(url: URL) {
  const pathname = url.pathname.replace(/\/+$/, "");

  return `${url.origin}${pathname}${url.search}`.toLowerCase();
}

function getHeaderValue(
  headers: IncomingHttpHeaders | Headers | undefined,
  key: string,
): string | null {
  if (!headers) {
    return null;
  }

  if (headers instanceof Headers) {
    return headers.get(key);
  }

  const value = headers[key.toLowerCase()];

  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return typeof value === "string" ? value : null;
}

function parseTitle(html: string) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);

  return match ? decodeHtml(match[1]).trim() : null;
}

function parseMetaContent(html: string, attribute: "name" | "property", value: string) {
  const pattern = new RegExp(
    `<meta[^>]*${attribute}=["']${escapeRegExp(value)}["'][^>]*content=["']([^"']*)["'][^>]*>`,
    "i",
  );
  const reversePattern = new RegExp(
    `<meta[^>]*content=["']([^"']*)["'][^>]*${attribute}=["']${escapeRegExp(value)}["'][^>]*>`,
    "i",
  );

  const directMatch = html.match(pattern);
  const reverseMatch = html.match(reversePattern);
  const content = directMatch?.[1] ?? reverseMatch?.[1] ?? null;

  return content ? decodeHtml(content).trim() : null;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}


function isPrivateIp(ip: string) {
  if (ip === "::1" || ip === "127.0.0.1") {
    return true;
  }

  if (ip.startsWith("10.") || ip.startsWith("192.168.") || ip.startsWith("169.254.")) {
    return true;
  }

  const match172 = ip.match(/^172\.(\d+)\./);

  if (match172) {
    const secondOctet = Number(match172[1]);

    if (secondOctet >= 16 && secondOctet <= 31) {
      return true;
    }
  }

  return ip.startsWith("fc") || ip.startsWith("fd") || ip.startsWith("fe80:");
}

async function validateUrlString(rawUrl: string) {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    return { error: "Enter a valid absolute URL.", fetchStatus: "invalid_url" as const };
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    return { error: "Only http and https URLs are supported.", fetchStatus: "invalid_url" as const };
  }

  const hostname = parsedUrl.hostname.toLowerCase();

  if (
    hostname === "localhost" ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal")
  ) {
    return {
      error: "Local and internal network URLs are blocked.",
      fetchStatus: "blocked" as const,
    };
  }

  try {
    const addresses = await lookup(hostname, { all: true, verbatim: true });

    if (addresses.some((address) => isPrivateIp(address.address))) {
      return {
        error: "Private network URLs are blocked.",
        fetchStatus: "blocked" as const,
      };
    }
  } catch {
    return {
      error: "The target hostname could not be resolved.",
      fetchStatus: "error" as const,
    };
  }

  return { url: parsedUrl };
}

async function fetchWithRedirects(url: URL): Promise<FetchResult> {
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => {
    abortController.abort();
  }, REQUEST_TIMEOUT_MS);

  try {
    let currentUrl = url;

    for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
      const response = await fetch(currentUrl, {
        headers: {
          Accept: "text/html,application/xhtml+xml",
          "User-Agent": "DevLinksMetadataBot/1.0 (+https://devlinks.local)",
        },
        redirect: "manual",
        signal: abortController.signal,
      });

      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get("location");

        if (!location) {
          throw new Error("Redirect response did not provide a location header.");
        }

        if (redirectCount === MAX_REDIRECTS) {
          throw new Error("Too many redirects.");
        }

        const nextUrl = new URL(location, currentUrl);
        const validatedNextUrl = await validateUrlString(nextUrl.toString());

        if ("error" in validatedNextUrl) {
          const blockedError = new Error(validatedNextUrl.error);
          blockedError.name = validatedNextUrl.fetchStatus ?? "error";
          throw blockedError;
        }

        currentUrl = validatedNextUrl.url;
        continue;
      }

      const contentType = response.headers.get("content-type") ?? "";

      if (!response.ok) {
        throw new Error(`Metadata request failed with status ${response.status}.`);
      }

      if (!contentType.includes("text/html")) {
        throw new Error("Only HTML metadata extraction is supported.");
      }

      const html = await response.text();

      return { finalUrl: currentUrl, html, response };
    }

    throw new Error("Too many redirects.");
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchMetadataPreview(url: string): Promise<MetadataPreview> {
  const validatedUrl = await validateUrlString(url);

  if ("error" in validatedUrl) {
    throw Object.assign(new Error(validatedUrl.error), {
      fetchStatus: validatedUrl.fetchStatus,
    });
  }

  const { finalUrl, html, response } = await fetchWithRedirects(validatedUrl.url);
  const title =
    parseMetaContent(html, "property", "og:title") ??
    parseMetaContent(html, "name", "twitter:title") ??
    parseTitle(html);
  const description =
    parseMetaContent(html, "property", "og:description") ??
    parseMetaContent(html, "name", "description") ??
    parseMetaContent(html, "name", "twitter:description");
  const imageUrl =
    parseMetaContent(html, "property", "og:image") ??
    parseMetaContent(html, "name", "twitter:image");
  const faviconPath =
    html.match(/<link[^>]*rel=["'][^"']*icon[^"']*["'][^>]*href=["']([^"']+)["'][^>]*>/i)?.[1] ??
    "/favicon.ico";
  const faviconUrl = faviconPath ? new URL(faviconPath, finalUrl).toString() : null;
  const suggestedTags = inferSuggestedTags(finalUrl.hostname, finalUrl.pathname, title, description);
  const resourceType = inferResourceType(finalUrl.hostname, finalUrl.pathname, title, description);
  const fetchStatus: MetadataFetchStatus =
    title && description && imageUrl ? "success" : "partial";

  return createMetadataPreview(finalUrl, {
    description,
    faviconUrl,
    fetchStatus,
    imageUrl,
    resourceType,
    suggestedTags,
    title,
    url: response.url || finalUrl.toString(),
  });
}

export async function handleMetadataRequest(
  request: ServerRequestLike,
  response: ServerResponseLike,
) {
  if (request.method && request.method.toUpperCase() !== "POST") {
    response.status(405).json({
      error: "Method not allowed.",
      fetchStatus: "error",
    });
    return;
  }

  const contentType = getHeaderValue(request.headers, "content-type");

  if (contentType && !contentType.includes("application/json")) {
    response.status(415).json({
      error: "Content-Type must be application/json.",
      fetchStatus: "error",
    });
    return;
  }

  const body = (request.body ?? {}) as MetadataRequestBody;

  if (typeof body.url !== "string") {
    response.status(400).json({
      error: "Request body must include a string url field.",
      fetchStatus: "invalid_url",
    });
    return;
  }

  try {
    const preview = await fetchMetadataPreview(body.url);
    response.status(200).json(preview);
  } catch (error) {
    const fetchStatus =
      typeof error === "object" && error !== null && "fetchStatus" in error
        ? (error as { fetchStatus: MetadataFetchStatus }).fetchStatus
        : error instanceof DOMException && error.name === "AbortError"
          ? "timeout"
          : error instanceof Error && error.name === "blocked"
            ? "blocked"
            : "error";
    const message =
      error instanceof Error ? error.message : "Metadata preview could not be generated.";
    const statusCode =
      fetchStatus === "invalid_url"
        ? 400
        : fetchStatus === "blocked"
          ? 403
          : fetchStatus === "timeout"
            ? 504
            : 502;

    response.status(statusCode).json({
      error: message,
      fetchStatus,
    });
  }
}
