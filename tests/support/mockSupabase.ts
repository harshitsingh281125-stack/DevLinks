import type { Page } from "@playwright/test";
import { DEMO_COLLECTIONS, DEMO_DISPLAY_NAME, DEMO_GITHUB_USERNAME, DEMO_USER_ID } from "../../src/seed/demoData";

// In-memory stand-in for the Supabase client, injected via window.__DEVLINKS_SUPABASE__
// (see src/lib/supabase.ts). It implements the subset of the query builder the app
// uses, and mirrors the two database rules the UI depends on:
//   - unique (user_id, normalized_url) on bookmarks → 23505
//   - collections with bookmarks can't be deleted  → 23503

export type MockSession = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at: number;
  token_type: "bearer";
  user: {
    id: string;
    email: string;
    user_metadata: Record<string, string>;
  };
};

type Row = Record<string, unknown>;

export const USER_ID = "6e2f0dc2-c932-4cc3-bef1-1b04fa6a6db5";

export const authenticatedSession: MockSession = {
  access_token: "test-access-token",
  refresh_token: "test-refresh-token",
  expires_in: 3600,
  expires_at: 4_102_444_800,
  token_type: "bearer",
  user: {
    id: USER_ID,
    email: "harshit@example.com",
    user_metadata: {
      full_name: "Harshit Singh",
      user_name: "harshit-singh",
    },
  },
};

const favicon = (domain: string) => `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

function daysAgo(n: number) {
  return new Date(Date.now() - n * 86_400_000).toISOString();
}

function canonical(url: string) {
  return url
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/^www\d*\./, "")
    .replace(/[#?].*$/, "")
    .replace(/\/+$/, "");
}

export type SeedOptions = {
  /** Give the signed-in user bookmarks in their first collection. */
  withBookmarks?: boolean;
  /** Use real favicon URLs (network) instead of letter fallbacks. */
  withFavicons?: boolean;
  /** Make the user's first collection and the React Debugging demo roadmaps. */
  roadmap?: boolean;
};

export function buildSeed({ withBookmarks = false, withFavicons = false, roadmap = false }: SeedOptions = {}) {
  const collections: Row[] = [
    {
      id: "collection-1",
      user_id: USER_ID,
      name: "React Debugging",
      description: "Tracing render bugs and hydration issues.",
      slug: null,
      is_public: false,
      is_roadmap: roadmap,
      created_at: "2026-04-13T00:00:00.000Z",
      updated_at: "2026-04-13T00:00:00.000Z",
    },
    {
      id: "collection-2",
      user_id: USER_ID,
      name: "API/Auth",
      description: "OAuth, JWT, and session handling notes.",
      slug: null,
      is_public: false,
      is_roadmap: false,
      created_at: "2026-04-13T00:01:00.000Z",
      updated_at: "2026-04-13T00:01:00.000Z",
    },
  ];

  const bookmarks: Row[] = [];

  if (withBookmarks) {
    collections[1] = { ...collections[1], is_public: true, slug: "api-auth-harshit" };
    const source = [...DEMO_COLLECTIONS[0].bookmarks, ...DEMO_COLLECTIONS[1].bookmarks.slice(0, 2)];
    source.forEach((b, i) => {
      bookmarks.push({
        id: `bm-${i + 1}`,
        user_id: USER_ID,
        collection_id: "collection-1",
        title: b.title,
        url: b.url,
        normalized_url: canonical(b.url),
        description: b.description,
        domain: b.domain,
        favicon_url: withFavicons ? favicon(b.domain) : null,
        image_url: null,
        resource_type: b.resourceType,
        tags: b.tags,
        position: i + 1,
        search_text: "",
        created_at: daysAgo(i * 3),
        updated_at: daysAgo(i * 3),
      });
    });
    DEMO_COLLECTIONS[2].bookmarks.slice(0, 3).forEach((b, i) => {
      bookmarks.push({
        id: `bm-auth-${i + 1}`,
        user_id: USER_ID,
        collection_id: "collection-2",
        title: b.title,
        url: b.url,
        normalized_url: canonical(b.url),
        description: b.description,
        domain: b.domain,
        favicon_url: withFavicons ? favicon(b.domain) : null,
        image_url: null,
        resource_type: b.resourceType,
        tags: b.tags,
        position: i + 1,
        search_text: "",
        created_at: daysAgo(20 + i),
        updated_at: daysAgo(20 + i),
      });
    });
  }

  // Public demo collections owned by a separate demo user.
  DEMO_COLLECTIONS.forEach((c, ci) => {
    collections.push({
      id: c.id,
      user_id: DEMO_USER_ID,
      name: c.name,
      description: c.description,
      slug: c.slug,
      is_public: true,
      is_roadmap: roadmap && ci === 0,
      created_at: `2026-03-0${ci + 1}T00:00:00.000Z`,
      updated_at: `2026-03-0${ci + 1}T00:00:00.000Z`,
    });
    c.bookmarks.forEach((b, i) => {
      bookmarks.push({
        id: b.id,
        user_id: DEMO_USER_ID,
        collection_id: c.id,
        title: b.title,
        url: b.url,
        normalized_url: canonical(b.url),
        description: b.description,
        domain: b.domain,
        favicon_url: withFavicons ? favicon(b.domain) : null,
        image_url: null,
        resource_type: b.resourceType,
        tags: b.tags,
        position: i + 1,
        search_text: "",
        created_at: daysAgo(40 + i),
        updated_at: daysAgo(40 + i),
      });
    });
  });

  const profiles: Row[] = [
    {
      id: DEMO_USER_ID,
      email: "demo@devlinks.app",
      github_username: DEMO_GITHUB_USERNAME,
      display_name: DEMO_DISPLAY_NAME,
      avatar_url: null,
      bio: "Curated reading lists for common web development problems.",
      location: null,
      website_url: null,
      twitter_handle: null,
      linkedin_url: null,
      created_at: "2026-03-01T00:00:00.000Z",
      updated_at: "2026-03-01T00:00:00.000Z",
    },
  ];

  return { collections, bookmarks, profiles };
}

export async function mockSupabase(
  page: Page,
  options: { session: MockSession | null; seed?: SeedOptions },
) {
  const seed = buildSeed(options.seed);

  await page.addInitScript(
    ({ initialSession, seedData }) => {
      type R = Record<string, unknown>;
      const db: Record<string, R[]> = {
        collections: seedData.collections,
        bookmarks: seedData.bookmarks,
        profiles: seedData.profiles,
      };
      const mutations: R[] = [];
      const oauthCalls: unknown[] = [];
      const listeners: Array<(event: string, session: unknown) => void> = [];
      let currentSession = initialSession;
      let idCounter = 100;

      const now = () => new Date().toISOString();
      const canonical = (url: string) =>
        url
          .toLowerCase()
          .trim()
          .replace(/^https?:\/\//, "")
          .replace(/^www\d*\./, "")
          .replace(/[#?].*$/, "")
          .replace(/\/+$/, "");

      function builder(table: string, op: "select" | "insert" | "update" | "delete" | "upsert", payload?: R) {
        const filters: Array<[string, unknown]> = [];
        const contains: Array<[string, unknown[]]> = [];
        const notNull: string[] = [];
        let text: string | null = null;
        let order: [string, boolean] | null = null;
        let columns = "";

        function matching() {
          return (db[table] ?? []).filter(
            (row) =>
              filters.every(([f, v]) => row[f] === v) &&
              notNull.every((f) => row[f] !== null && row[f] !== undefined) &&
              contains.every(([f, arr]) => arr.every((x) => (row[f] as unknown[]).includes(x))) &&
              (!text ||
                text
                  .toLowerCase()
                  .split(/\s+/)
                  .every((tok) =>
                    [row.title, row.url, row.description, row.domain, ...((row.tags as string[]) ?? []), row.resource_type]
                      .join(" ")
                      .toLowerCase()
                      .includes(tok),
                  )),
          );
        }

        function withJoins(row: R) {
          const joined: R = { ...row };
          if (columns.includes("profiles(")) {
            joined.profiles = db.profiles.find((p) => p.id === row.user_id) ?? null;
          }
          if (table === "collections" && columns.includes("bookmarks(")) {
            joined.bookmarks = db.bookmarks.filter((b) => b.collection_id === row.id).map((b) => ({ ...b }));
          }
          return joined;
        }

        function execute(): { data: unknown; error: unknown } {
          if (op === "select") {
            let rows = matching();
            if (order) {
              const [field, asc] = order;
              rows = [...rows].sort((a, b) => (a[field]! > b[field]! ? 1 : -1) * (asc ? 1 : -1));
            }
            return { data: rows.map(withJoins), error: null };
          }

          if (op === "insert") {
            if (table === "bookmarks") {
              const key = canonical(String(payload!.url));
              const clash = db.bookmarks.find((r) => r.user_id === payload!.user_id && r.normalized_url === key);
              if (clash) return { data: null, error: { code: "23505", message: "duplicate key value" } };
            }
            const nextPosition =
              table === "bookmarks"
                ? Math.max(0, ...db.bookmarks.filter((b) => b.collection_id === payload!.collection_id).map((b) => Number(b.position))) + 1
                : undefined;
            const row: R = {
              id: `${table}-${++idCounter}`,
              slug: null,
              is_public: false,
              is_roadmap: false,
              ...(table === "bookmarks" ? { position: nextPosition } : {}),
              image_url: null,
              search_text: "",
              ...payload,
              ...(table === "bookmarks" ? { normalized_url: canonical(String(payload!.url)) } : {}),
              created_at: now(),
              updated_at: now(),
            };
            db[table].push(row);
            mutations.push({ table, type: "insert", payload: row });
            return { data: [row], error: null };
          }

          if (op === "upsert") {
            const existing = db[table].find((r) => r.id === payload!.id);
            const row = { ...(existing ?? {}), ...payload, created_at: existing?.created_at ?? now(), updated_at: now() };
            if (existing) Object.assign(existing, row);
            else db[table].push(row);
            mutations.push({ table, type: "upsert", payload: row });
            return { data: [row], error: null };
          }

          if (op === "update") {
            const rows = matching();
            rows.forEach((r) => {
              const moved = table === "bookmarks" && payload!.collection_id !== undefined && payload!.collection_id !== r.collection_id;
              Object.assign(r, payload, { updated_at: now() });
              if (moved) {
                r.position =
                  Math.max(0, ...db.bookmarks.filter((b) => b !== r && b.collection_id === r.collection_id).map((b) => Number(b.position))) + 1;
              }
            });
            rows.forEach((r) => mutations.push({ table, type: "update", payload: { ...r } }));
            return { data: rows.map((r) => ({ ...r })), error: null };
          }

          // delete
          const rows = matching();
          if (table === "collections" && rows.some((c) => db.bookmarks.some((b) => b.collection_id === c.id))) {
            return {
              data: null,
              error: { code: "23503", message: "update or delete on table collections violates foreign key" },
            };
          }
          db[table] = db[table].filter((r) => !rows.includes(r));
          rows.forEach((r) => mutations.push({ table, type: "delete", payload: { id: r.id } }));
          return { data: rows.map((r) => ({ id: r.id })), error: null };
        }

        function asList() {
          const { data, error } = execute();
          return Promise.resolve({ data: error ? null : data, error });
        }

        const api = {
          select(cols?: string) {
            columns = cols ?? "*";
            return api;
          },
          eq(field: string, value: unknown) {
            filters.push([field, value]);
            return api;
          },
          not(field: string, operator: string, value: unknown) {
            // Only `.not(field, "is", null)` is used by the app.
            if (operator === "is" && value === null) notNull.push(field);
            return api;
          },
          contains(field: string, value: unknown[]) {
            contains.push([field, value]);
            return api;
          },
          textSearch(_field: string, query: string) {
            text = query;
            return api;
          },
          order(field: string, opts?: { ascending?: boolean }) {
            order = [field, opts?.ascending !== false];
            return api;
          },
          single() {
            const { data, error } = execute();
            if (error) return Promise.resolve({ data: null, error });
            const rows = data as R[];
            if (rows.length !== 1) {
              return Promise.resolve({ data: null, error: { code: "PGRST116", message: "Row not found." } });
            }
            return Promise.resolve({ data: rows[0], error: null });
          },
          maybeSingle() {
            const { data, error } = execute();
            if (error) return Promise.resolve({ data: null, error });
            return Promise.resolve({ data: (data as R[])[0] ?? null, error: null });
          },
          then(resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) {
            return asList().then(resolve, reject);
          },
        };
        return api;
      }

      const w = window as unknown as Record<string, unknown>;
      w.__DEVLINKS_MUTATIONS__ = mutations;
      w.__DEVLINKS_OAUTH_CALLS__ = oauthCalls;
      w.__DEVLINKS_SUPABASE__ = {
        auth: {
          getSession: async () => ({ data: { session: currentSession }, error: null }),
          onAuthStateChange: (callback: (event: string, session: unknown) => void) => {
            listeners.push(callback);
            return {
              data: {
                subscription: {
                  unsubscribe: () => {
                    const i = listeners.indexOf(callback);
                    if (i >= 0) listeners.splice(i, 1);
                  },
                },
              },
            };
          },
          signInWithOAuth: async (oauthOptions: unknown) => {
            oauthCalls.push(oauthOptions);
            return { data: { provider: "github", url: null }, error: null };
          },
          signOut: async () => {
            currentSession = null;
            listeners.forEach((listener) => listener("SIGNED_OUT", null));
            return { error: null };
          },
        },
        rpc: async (fn: string, args: { p_collection_id: string; p_bookmark_ids: string[] }) => {
          if (fn !== "reorder_bookmarks") return { data: null, error: { message: `Unknown function ${fn}` } };
          const uid = (currentSession as { user?: { id?: string } } | null)?.user?.id;
          const owned = db.bookmarks.filter((b) => b.collection_id === args.p_collection_id && b.user_id === uid);
          const ids = args.p_bookmark_ids;
          const valid =
            ids.length === owned.length &&
            new Set(ids).size === ids.length &&
            ids.every((id) => owned.some((b) => b.id === id));
          if (!valid) return { data: null, error: { code: "22023", message: "Order is out of date. Reload and try again." } };
          ids.forEach((id, i) => {
            const row = owned.find((b) => b.id === id)!;
            row.position = i + 1;
          });
          mutations.push({ table: "bookmarks", type: "reorder", payload: { collectionId: args.p_collection_id, ids: [...ids] } });
          return { data: null, error: null };
        },
        from: (table: string) => ({
          select: (cols?: string) => builder(table, "select").select(cols),
          insert: (payload: R) => builder(table, "insert", payload),
          upsert: (payload: R) => builder(table, "upsert", payload),
          update: (payload: R) => builder(table, "update", payload),
          delete: () => builder(table, "delete"),
        }),
        storage: {
          from: () => ({
            upload: async () => ({ data: null, error: null }),
            getPublicUrl: () => ({ data: { publicUrl: "" } }),
          }),
        },
      };
    },
    { initialSession: options.session, seedData: seed },
  );
}

export async function readMutations(page: Page) {
  return page.evaluate(
    () => ((window as unknown as Record<string, unknown>).__DEVLINKS_MUTATIONS__ as Row[]) ?? [],
  );
}

export async function readOauthCalls(page: Page) {
  return page.evaluate(
    () => ((window as unknown as Record<string, unknown>).__DEVLINKS_OAUTH_CALLS__ as unknown[]) ?? [],
  );
}
