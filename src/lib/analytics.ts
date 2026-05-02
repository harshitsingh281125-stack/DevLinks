// ─── Event types ─────────────────────────────────────────────────────────────

export type SignupEvent = {
  name: "signup";
  props: { userId: string };
};

export type FirstBookmarkEvent = {
  name: "first_bookmark";
};

export type SearchEvent = {
  name: "search";
  props: { query: string };
};

export type PublicToggleEvent = {
  name: "public_toggle";
  props: { collectionId: string; isPublic: boolean };
};

export type PublicPageViewEvent = {
  name: "public_page_view";
  props: { slug: string; collectionId: string };
};

export type AnalyticsEvent =
  | SignupEvent
  | FirstBookmarkEvent
  | SearchEvent
  | PublicToggleEvent
  | PublicPageViewEvent;

export type AnalyticsHandler = (event: AnalyticsEvent) => void;

// ─── Plausible provider ───────────────────────────────────────────────────────
// Plausible injects a `window.plausible(eventName, { props })` global.
// We call it when available and silently skip it otherwise.

type PlausibleFn = (
  eventName: string,
  opts?: { props?: Record<string, unknown> },
) => void;

function callPlausible(event: AnalyticsEvent): void {
  if (typeof window === "undefined") return;
  const w = window as Window & { plausible?: PlausibleFn };
  if (typeof w.plausible !== "function") return;
  const props = "props" in event ? (event.props as Record<string, unknown>) : undefined;
  w.plausible(event.name, props ? { props } : undefined);
}

// ─── Default handler ──────────────────────────────────────────────────────────

function defaultHandler(event: AnalyticsEvent): void {
  callPlausible(event);
}

// ─── Public API ───────────────────────────────────────────────────────────────

let _currentHandler: AnalyticsHandler = defaultHandler;

/** Fire an analytics event. No-ops gracefully if no provider is configured. */
export function track(event: AnalyticsEvent): void {
  _currentHandler(event);
}

/**
 * Replace the active analytics handler.
 * Intended for tests only — inject a spy to capture emitted events.
 */
export function _setAnalyticsHandler(handler: AnalyticsHandler): void {
  _currentHandler = handler;
}

/**
 * Restore the default (Plausible) analytics handler.
 * Call this in afterEach to prevent handler leakage between tests.
 */
export function _resetAnalyticsHandler(): void {
  _currentHandler = defaultHandler;
}

// ─── First-bookmark flag ──────────────────────────────────────────────────────
// Tracks whether the user has ever saved a bookmark so we fire `first_bookmark`
// only once per browser. Falls back gracefully in environments without
// localStorage (SSR, private browsing with storage blocked, test environments).

const FIRST_BOOKMARK_FLAG = "dl_first_bookmark_fired";

export function hasFirstBookmarkBeenFired(): boolean {
  try {
    return localStorage.getItem(FIRST_BOOKMARK_FLAG) === "1";
  } catch {
    return false;
  }
}

export function markFirstBookmarkFired(): void {
  try {
    localStorage.setItem(FIRST_BOOKMARK_FLAG, "1");
  } catch {
    // Silently ignore (quota exceeded, private browsing storage restrictions).
  }
}
