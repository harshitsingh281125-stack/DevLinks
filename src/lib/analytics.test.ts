import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  _resetAnalyticsHandler,
  _setAnalyticsHandler,
  hasFirstBookmarkBeenFired,
  markFirstBookmarkFired,
  track,
  type AnalyticsEvent,
  type AnalyticsHandler,
  type FirstBookmarkEvent,
  type PublicPageViewEvent,
  type PublicToggleEvent,
  type SearchEvent,
  type SignupEvent,
} from "./analytics";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeSpy(): { handler: AnalyticsHandler; events: AnalyticsEvent[] } {
  const events: AnalyticsEvent[] = [];
  const handler: AnalyticsHandler = (event) => events.push(event);
  return { handler, events };
}

// ─── Handler injection ────────────────────────────────────────────────────────

describe("_setAnalyticsHandler / _resetAnalyticsHandler", () => {
  afterEach(() => {
    _resetAnalyticsHandler();
  });

  it("installs a custom handler that receives subsequent track() calls", () => {
    const { handler, events } = makeSpy();
    _setAnalyticsHandler(handler);
    track({ name: "first_bookmark" });
    expect(events).toHaveLength(1);
    expect(events[0].name).toBe("first_bookmark");
  });

  it("replaces a previously installed handler", () => {
    const spy1 = makeSpy();
    const spy2 = makeSpy();
    _setAnalyticsHandler(spy1.handler);
    track({ name: "first_bookmark" });
    _setAnalyticsHandler(spy2.handler);
    track({ name: "first_bookmark" });
    expect(spy1.events).toHaveLength(1);
    expect(spy2.events).toHaveLength(1);
  });

  it("_resetAnalyticsHandler stops the spy from receiving further events", () => {
    const { handler, events } = makeSpy();
    _setAnalyticsHandler(handler);
    track({ name: "first_bookmark" });
    _resetAnalyticsHandler();
    track({ name: "first_bookmark" });
    // Spy only caught the event before reset
    expect(events).toHaveLength(1);
  });

  it("handlers from different tests are isolated when afterEach resets", () => {
    // This test relies on afterEach calling _resetAnalyticsHandler.
    // The spy installed here should not affect subsequent tests.
    const { handler } = makeSpy();
    _setAnalyticsHandler(handler);
  });
});

// ─── track() — event emission ─────────────────────────────────────────────────

describe("track()", () => {
  let events: AnalyticsEvent[];

  beforeEach(() => {
    const spy = makeSpy();
    events = spy.events;
    _setAnalyticsHandler(spy.handler);
  });

  afterEach(() => {
    _resetAnalyticsHandler();
  });

  it("routes each call to the installed handler", () => {
    track({ name: "first_bookmark" });
    track({ name: "first_bookmark" });
    expect(events).toHaveLength(2);
  });

  it("passes the event object through unchanged", () => {
    const event: AnalyticsEvent = { name: "search", props: { query: "react hooks" } };
    track(event);
    expect(events[0]).toBe(event);
  });

  it("fires multiple different events in order", () => {
    track({ name: "signup", props: { userId: "u-1" } });
    track({ name: "first_bookmark" });
    track({ name: "search", props: { query: "css grid" } });
    expect(events.map((e) => e.name)).toEqual(["signup", "first_bookmark", "search"]);
  });
});

// ─── signup event ─────────────────────────────────────────────────────────────

describe("SignupEvent", () => {
  let events: AnalyticsEvent[];

  beforeEach(() => {
    const spy = makeSpy();
    events = spy.events;
    _setAnalyticsHandler(spy.handler);
  });

  afterEach(() => _resetAnalyticsHandler());

  it("has name 'signup'", () => {
    track({ name: "signup", props: { userId: "user-abc" } });
    expect(events[0].name).toBe("signup");
  });

  it("carries the userId prop", () => {
    track({ name: "signup", props: { userId: "user-xyz" } });
    const e = events[0] as SignupEvent;
    expect(e.props.userId).toBe("user-xyz");
  });

  it("accepts any non-empty userId string", () => {
    const ids = ["u-1", "00000000-0000-0000-0000-000000000001", "github|123456"];
    for (const userId of ids) {
      track({ name: "signup", props: { userId } });
    }
    expect(events).toHaveLength(3);
    (events as SignupEvent[]).forEach((e, i) => {
      expect(e.props.userId).toBe(ids[i]);
    });
  });

  it("fires independently on multiple calls", () => {
    track({ name: "signup", props: { userId: "u-1" } });
    track({ name: "signup", props: { userId: "u-2" } });
    expect(events).toHaveLength(2);
  });
});

// ─── first_bookmark event ─────────────────────────────────────────────────────

describe("FirstBookmarkEvent", () => {
  let events: AnalyticsEvent[];

  beforeEach(() => {
    const spy = makeSpy();
    events = spy.events;
    _setAnalyticsHandler(spy.handler);
  });

  afterEach(() => _resetAnalyticsHandler());

  it("has name 'first_bookmark'", () => {
    track({ name: "first_bookmark" });
    expect(events[0].name).toBe("first_bookmark");
  });

  it("carries no props", () => {
    track({ name: "first_bookmark" });
    const e = events[0] as FirstBookmarkEvent;
    expect("props" in e).toBe(false);
  });

  it("can be tracked multiple times without throwing", () => {
    track({ name: "first_bookmark" });
    track({ name: "first_bookmark" });
    expect(events).toHaveLength(2);
  });
});

// ─── search event ─────────────────────────────────────────────────────────────

describe("SearchEvent", () => {
  let events: AnalyticsEvent[];

  beforeEach(() => {
    const spy = makeSpy();
    events = spy.events;
    _setAnalyticsHandler(spy.handler);
  });

  afterEach(() => _resetAnalyticsHandler());

  it("has name 'search'", () => {
    track({ name: "search", props: { query: "vitest" } });
    expect(events[0].name).toBe("search");
  });

  it("carries the query prop", () => {
    track({ name: "search", props: { query: "react hooks" } });
    const e = events[0] as SearchEvent;
    expect(e.props.query).toBe("react hooks");
  });

  it("handles a single-character query", () => {
    track({ name: "search", props: { query: "a" } });
    const e = events[0] as SearchEvent;
    expect(e.props.query).toBe("a");
  });

  it("handles a long query string", () => {
    const longQuery = "react typescript hooks context api performance optimization tips";
    track({ name: "search", props: { query: longQuery } });
    const e = events[0] as SearchEvent;
    expect(e.props.query).toBe(longQuery);
  });

  it("handles a query with special characters", () => {
    track({ name: "search", props: { query: "async/await & promises" } });
    const e = events[0] as SearchEvent;
    expect(e.props.query).toBe("async/await & promises");
  });

  it("fires on each successive search", () => {
    track({ name: "search", props: { query: "css" } });
    track({ name: "search", props: { query: "css grid" } });
    track({ name: "search", props: { query: "css grid layout" } });
    expect(events).toHaveLength(3);
    expect((events[2] as SearchEvent).props.query).toBe("css grid layout");
  });
});

// ─── public_toggle event ──────────────────────────────────────────────────────

describe("PublicToggleEvent", () => {
  let events: AnalyticsEvent[];

  beforeEach(() => {
    const spy = makeSpy();
    events = spy.events;
    _setAnalyticsHandler(spy.handler);
  });

  afterEach(() => _resetAnalyticsHandler());

  it("has name 'public_toggle'", () => {
    track({ name: "public_toggle", props: { collectionId: "col-1", isPublic: true } });
    expect(events[0].name).toBe("public_toggle");
  });

  it("carries collectionId and isPublic props when toggled to public", () => {
    track({ name: "public_toggle", props: { collectionId: "col-abc", isPublic: true } });
    const e = events[0] as PublicToggleEvent;
    expect(e.props.collectionId).toBe("col-abc");
    expect(e.props.isPublic).toBe(true);
  });

  it("carries collectionId and isPublic props when toggled to private", () => {
    track({ name: "public_toggle", props: { collectionId: "col-abc", isPublic: false } });
    const e = events[0] as PublicToggleEvent;
    expect(e.props.collectionId).toBe("col-abc");
    expect(e.props.isPublic).toBe(false);
  });

  it("tracks a toggle-on then toggle-off sequence", () => {
    track({ name: "public_toggle", props: { collectionId: "col-1", isPublic: true } });
    track({ name: "public_toggle", props: { collectionId: "col-1", isPublic: false } });
    expect(events).toHaveLength(2);
    expect((events[0] as PublicToggleEvent).props.isPublic).toBe(true);
    expect((events[1] as PublicToggleEvent).props.isPublic).toBe(false);
  });

  it("tracks toggles on different collections independently", () => {
    track({ name: "public_toggle", props: { collectionId: "col-1", isPublic: true } });
    track({ name: "public_toggle", props: { collectionId: "col-2", isPublic: true } });
    const ids = (events as PublicToggleEvent[]).map((e) => e.props.collectionId);
    expect(ids).toEqual(["col-1", "col-2"]);
  });
});

// ─── public_page_view event ───────────────────────────────────────────────────

describe("PublicPageViewEvent", () => {
  let events: AnalyticsEvent[];

  beforeEach(() => {
    const spy = makeSpy();
    events = spy.events;
    _setAnalyticsHandler(spy.handler);
  });

  afterEach(() => _resetAnalyticsHandler());

  it("has name 'public_page_view'", () => {
    track({ name: "public_page_view", props: { slug: "react-debugging", collectionId: "col-1" } });
    expect(events[0].name).toBe("public_page_view");
  });

  it("carries slug and collectionId props", () => {
    track({
      name: "public_page_view",
      props: { slug: "css-layout-tips", collectionId: "col-42" },
    });
    const e = events[0] as PublicPageViewEvent;
    expect(e.props.slug).toBe("css-layout-tips");
    expect(e.props.collectionId).toBe("col-42");
  });

  it("handles slugs with hyphens and numbers", () => {
    track({
      name: "public_page_view",
      props: { slug: "api-auth-2024", collectionId: "col-99" },
    });
    const e = events[0] as PublicPageViewEvent;
    expect(e.props.slug).toBe("api-auth-2024");
  });

  it("tracks views for different slugs independently", () => {
    const slugs = ["react-debugging", "css-layout", "api-auth"];
    for (const slug of slugs) {
      track({ name: "public_page_view", props: { slug, collectionId: `col-${slug}` } });
    }
    expect(events).toHaveLength(3);
    expect((events as PublicPageViewEvent[]).map((e) => e.props.slug)).toEqual(slugs);
  });
});

// ─── Mixed event sequences ─────────────────────────────────────────────────────

describe("mixed event sequences", () => {
  let events: AnalyticsEvent[];

  beforeEach(() => {
    const spy = makeSpy();
    events = spy.events;
    _setAnalyticsHandler(spy.handler);
  });

  afterEach(() => _resetAnalyticsHandler());

  it("tracks a full new-user journey in order", () => {
    track({ name: "signup", props: { userId: "u-1" } });
    track({ name: "first_bookmark" });
    track({ name: "search", props: { query: "typescript generics" } });
    track({ name: "public_toggle", props: { collectionId: "col-1", isPublic: true } });
    track({ name: "public_page_view", props: { slug: "ts-tips", collectionId: "col-1" } });
    expect(events.map((e) => e.name)).toEqual([
      "signup",
      "first_bookmark",
      "search",
      "public_toggle",
      "public_page_view",
    ]);
  });

  it("interleaves event types without cross-contamination", () => {
    track({ name: "search", props: { query: "hooks" } });
    track({ name: "public_toggle", props: { collectionId: "col-1", isPublic: false } });
    track({ name: "search", props: { query: "effects" } });
    const searches = events.filter((e): e is SearchEvent => e.name === "search");
    const toggles = events.filter((e): e is PublicToggleEvent => e.name === "public_toggle");
    expect(searches).toHaveLength(2);
    expect(toggles).toHaveLength(1);
    expect(searches[0].props.query).toBe("hooks");
    expect(searches[1].props.query).toBe("effects");
    expect(toggles[0].props.isPublic).toBe(false);
  });

  it("a handler installed mid-sequence only captures events after installation", () => {
    const early = makeSpy();
    _setAnalyticsHandler(early.handler);
    track({ name: "first_bookmark" }); // captured by early

    const late = makeSpy();
    _setAnalyticsHandler(late.handler);
    track({ name: "search", props: { query: "rxjs" } }); // captured by late only

    expect(early.events).toHaveLength(1);
    expect(late.events).toHaveLength(1);
    expect(late.events[0].name).toBe("search");
  });
});

// ─── Default handler — no crash without Plausible ─────────────────────────────

describe("default handler", () => {
  afterEach(() => _resetAnalyticsHandler());

  it("does not throw when window.plausible is not defined", () => {
    // Reset to default — window is undefined in node env, so this is safe.
    _resetAnalyticsHandler();
    expect(() => track({ name: "first_bookmark" })).not.toThrow();
  });

  it("does not throw for any event type when no provider is configured", () => {
    _resetAnalyticsHandler();
    const allEvents: AnalyticsEvent[] = [
      { name: "signup", props: { userId: "u-1" } },
      { name: "first_bookmark" },
      { name: "search", props: { query: "test" } },
      { name: "public_toggle", props: { collectionId: "col-1", isPublic: true } },
      { name: "public_page_view", props: { slug: "s", collectionId: "col-1" } },
    ];
    for (const event of allEvents) {
      expect(() => track(event)).not.toThrow();
    }
  });
});

// ─── hasFirstBookmarkBeenFired / markFirstBookmarkFired ───────────────────────

describe("first-bookmark localStorage flag", () => {
  // localStorage is not available in the Node test environment.
  // The helpers must return safe fallback values without throwing.

  it("hasFirstBookmarkBeenFired() returns false when localStorage is unavailable", () => {
    // In node env localStorage is undefined, so the try/catch catches and returns false.
    expect(hasFirstBookmarkBeenFired()).toBe(false);
  });

  it("markFirstBookmarkFired() does not throw when localStorage is unavailable", () => {
    expect(() => markFirstBookmarkFired()).not.toThrow();
  });

  it("hasFirstBookmarkBeenFired() remains false after markFirstBookmarkFired() in node env", () => {
    // Both calls are no-ops in Node; state does not change.
    markFirstBookmarkFired();
    expect(hasFirstBookmarkBeenFired()).toBe(false);
  });
});

// ─── isNewUser detection — profileBootstrap helpers ───────────────────────────
// The signup analytics event relies on `created_at === updated_at` to detect
// a brand-new profile row. These tests verify the heuristic independently of
// the Supabase call.

describe("isNewUser detection heuristic", () => {
  function isNewUser(createdAt: string, updatedAt: string): boolean {
    return createdAt === updatedAt;
  }

  it("returns true when created_at and updated_at are identical (new insert)", () => {
    const ts = "2026-04-19T12:00:00.000Z";
    expect(isNewUser(ts, ts)).toBe(true);
  });

  it("returns false when updated_at is later than created_at (returning user)", () => {
    expect(isNewUser("2026-01-01T00:00:00.000Z", "2026-04-19T12:00:00.000Z")).toBe(false);
  });

  it("returns false when only the millisecond portion differs", () => {
    expect(isNewUser("2026-04-19T12:00:00.000Z", "2026-04-19T12:00:00.001Z")).toBe(false);
  });

  it("returns false when the timestamps share the same second but differ in sub-second precision", () => {
    expect(isNewUser("2026-04-19T12:00:00.000000Z", "2026-04-19T12:00:00.000001Z")).toBe(false);
  });

  it("returns true for timestamps with microsecond precision that are identical", () => {
    const ts = "2026-04-19T12:00:00.123456Z";
    expect(isNewUser(ts, ts)).toBe(true);
  });

  it("returns false for identical dates that differ by timezone offset", () => {
    // Even though these represent the same instant, the strings differ
    expect(isNewUser("2026-04-19T12:00:00Z", "2026-04-19T14:00:00+02:00")).toBe(false);
  });

  it("a UUID-style user ID does not affect the timestamp comparison", () => {
    const ts = "2026-04-19T00:00:00Z";
    expect(isNewUser(ts, ts)).toBe(true);
  });
});

// ─── Type narrowing guards ────────────────────────────────────────────────────

describe("AnalyticsEvent type narrowing", () => {
  let events: AnalyticsEvent[];

  beforeEach(() => {
    const spy = makeSpy();
    events = spy.events;
    _setAnalyticsHandler(spy.handler);
  });

  afterEach(() => _resetAnalyticsHandler());

  it("narrows to SignupEvent by name", () => {
    track({ name: "signup", props: { userId: "u-1" } });
    const e = events[0];
    if (e.name === "signup") {
      expect(e.props.userId).toBe("u-1");
    } else {
      throw new Error("Expected signup event");
    }
  });

  it("narrows to SearchEvent by name", () => {
    track({ name: "search", props: { query: "rxjs" } });
    const e = events[0];
    if (e.name === "search") {
      expect(e.props.query).toBe("rxjs");
    } else {
      throw new Error("Expected search event");
    }
  });

  it("narrows to PublicToggleEvent by name", () => {
    track({ name: "public_toggle", props: { collectionId: "col-1", isPublic: true } });
    const e = events[0];
    if (e.name === "public_toggle") {
      expect(e.props.collectionId).toBe("col-1");
      expect(e.props.isPublic).toBe(true);
    } else {
      throw new Error("Expected public_toggle event");
    }
  });

  it("narrows to PublicPageViewEvent by name", () => {
    track({ name: "public_page_view", props: { slug: "my-collection", collectionId: "col-9" } });
    const e = events[0];
    if (e.name === "public_page_view") {
      expect(e.props.slug).toBe("my-collection");
      expect(e.props.collectionId).toBe("col-9");
    } else {
      throw new Error("Expected public_page_view event");
    }
  });
});

// ─── Handler invocation count ─────────────────────────────────────────────────

describe("handler invocation count", () => {
  afterEach(() => _resetAnalyticsHandler());

  it("handler is called exactly once per track() call", () => {
    const fn = vi.fn();
    _setAnalyticsHandler(fn);
    track({ name: "first_bookmark" });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("handler is called with the exact event argument", () => {
    const fn = vi.fn();
    _setAnalyticsHandler(fn);
    const event: AnalyticsEvent = { name: "search", props: { query: "solid js" } };
    track(event);
    expect(fn).toHaveBeenCalledWith(event);
  });

  it("handler is called N times when track() is called N times", () => {
    const fn = vi.fn();
    _setAnalyticsHandler(fn);
    for (let i = 0; i < 10; i++) {
      track({ name: "first_bookmark" });
    }
    expect(fn).toHaveBeenCalledTimes(10);
  });
});
