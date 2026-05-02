import { expect, test, type Page } from "@playwright/test";

type MockSession = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at: number;
  token_type: "bearer";
  user: {
    id: string;
    email: string;
    user_metadata: {
      full_name: string;
      user_name?: string;
    };
  };
};

type MockCollectionRow = {
  created_at: string;
  description: string | null;
  id: string;
  is_public: boolean;
  name: string;
  slug: string | null;
  updated_at: string;
  user_id: string;
};

type MockSupabaseOptions = {
  protectedDeleteIds?: string[];
  session: MockSession | null;
};

const authenticatedSession: MockSession = {
  access_token: "test-access-token",
  refresh_token: "test-refresh-token",
  expires_in: 3600,
  expires_at: 4_102_444_800,
  token_type: "bearer",
  user: {
    id: "6e2f0dc2-c932-4cc3-bef1-1b04fa6a6db5",
    email: "harshit@example.com",
    user_metadata: {
      full_name: "Harshit Singh",
      user_name: "harshit-singh",
    },
  },
};

async function mockSupabase(page: Page, options: MockSupabaseOptions) {
  const initialCollections: MockCollectionRow[] = [
    {
      id: "collection-1",
      user_id: authenticatedSession.user.id,
      name: "React Debugging",
      description: "Tracing render bugs and hydration issues.",
      slug: null,
      is_public: false,
      created_at: "2026-04-13T00:00:00.000Z",
      updated_at: "2026-04-13T00:00:00.000Z",
    },
    {
      id: "collection-2",
      user_id: authenticatedSession.user.id,
      name: "API/Auth",
      description: "OAuth, JWT, and session handling notes.",
      slug: null,
      is_public: false,
      created_at: "2026-04-13T00:01:00.000Z",
      updated_at: "2026-04-13T00:01:00.000Z",
    },
  ];

  await page.addInitScript(
    ({ initialProtectedDeleteIds, initialSession, seedCollections }) => {
      const listeners: Array<(event: string, session: unknown) => void> = [];
      const profileUpserts: unknown[] = [];
      const oauthCalls: unknown[] = [];
      const collectionMutations: unknown[] = [];
      const collections = [...seedCollections];
      const protectedDeleteIds = new Set(initialProtectedDeleteIds);
      let currentSession = initialSession;

      function matchesFilters<T extends Record<string, unknown>>(
        row: T,
        filters: Array<{ field: string; value: unknown }>,
      ) {
        return filters.every((filter) => row[filter.field] === filter.value);
      }

      function createCollectionsTable() {
        return {
          select(columns?: string) {
            const filters: Array<{ field: string; value: unknown }> = [];

            const selection = {
              eq(field: string, value: unknown) {
                filters.push({ field, value });
                return selection;
              },
              async order(field: string, options?: { ascending?: boolean }) {
                const rows = collections
                  .filter((row) => matchesFilters(row, filters))
                  .sort((left, right) => {
                    if (left[field] === right[field]) {
                      return 0;
                    }

                    const direction = options?.ascending === false ? -1 : 1;

                    return left[field] > right[field] ? direction : -direction;
                  });

                return {
                  data: columns === "id"
                    ? rows.map((row) => ({ id: row.id }))
                    : rows,
                  error: null,
                };
              },
            };

            return selection;
          },
          insert(payload: Record<string, unknown>) {
            return {
              select() {
                return {
                  async single() {
                    const row = {
                      id: `collection-${collections.length + 1}`,
                      user_id: payload.user_id as string,
                      name: payload.name as string,
                      description: (payload.description as string | null) ?? null,
                      slug: null,
                      is_public: false,
                      created_at: "2026-04-13T01:00:00.000Z",
                      updated_at: "2026-04-13T01:00:00.000Z",
                    };

                    collections.push(row);
                    collectionMutations.push({ type: "insert", payload: row });

                    return { data: row, error: null };
                  },
                };
              },
            };
          },
          update(payload: Record<string, unknown>) {
            const filters: Array<{ field: string; value: unknown }> = [];

            const selection = {
              eq(field: string, value: unknown) {
                filters.push({ field, value });
                return selection;
              },
              select() {
                return {
                  async single() {
                    const row = collections.find((item) => matchesFilters(item, filters));

                    if (!row) {
                      return {
                        data: null,
                        error: { code: "PGRST116", message: "Collection not found." },
                      };
                    }

                    Object.assign(row, payload, {
                      updated_at: "2026-04-13T02:00:00.000Z",
                    });

                    collectionMutations.push({ type: "update", payload: row });

                    return { data: row, error: null };
                  },
                };
              },
            };

            return selection;
          },
          delete() {
            const filters: Array<{ field: string; value: unknown }> = [];

            const selection = {
              eq(field: string, value: unknown) {
                filters.push({ field, value });
                return selection;
              },
              select() {
                return {
                  async single() {
                    const rowIndex = collections.findIndex((item) =>
                      matchesFilters(item, filters),
                    );

                    if (rowIndex < 0) {
                      return {
                        data: null,
                        error: { code: "PGRST116", message: "Collection not found." },
                      };
                    }

                    const row = collections[rowIndex];

                    if (protectedDeleteIds.has(row.id)) {
                      return {
                        data: null,
                        error: {
                          code: "23503",
                          message: "update or delete on table collections violates foreign key",
                        },
                      };
                    }

                    collections.splice(rowIndex, 1);
                    collectionMutations.push({ type: "delete", payload: { id: row.id } });

                    return { data: { id: row.id }, error: null };
                  },
                };
              },
            };

            return selection;
          },
        };
      }

      (window as typeof window & {
        __DEVLINKS_COLLECTION_MUTATIONS__?: unknown[];
        __DEVLINKS_OAUTH_CALLS__?: unknown[];
        __DEVLINKS_PROFILE_UPSERTS__?: unknown[];
      }).__DEVLINKS_PROFILE_UPSERTS__ = profileUpserts;
      (window as typeof window & {
        __DEVLINKS_COLLECTION_MUTATIONS__?: unknown[];
      }).__DEVLINKS_COLLECTION_MUTATIONS__ = collectionMutations;
      (window as typeof window & {
        __DEVLINKS_OAUTH_CALLS__?: unknown[];
      }).__DEVLINKS_OAUTH_CALLS__ = oauthCalls;

      (window as typeof window & { __DEVLINKS_SUPABASE__: unknown }).__DEVLINKS_SUPABASE__ = {
        auth: {
          getSession: async () => ({
            data: { session: currentSession },
            error: null,
          }),
          onAuthStateChange: (callback: (event: string, session: unknown) => void) => {
            listeners.push(callback);

            return {
              data: {
                subscription: {
                  unsubscribe: () => {
                    const index = listeners.indexOf(callback);

                    if (index >= 0) {
                      listeners.splice(index, 1);
                    }
                  },
                },
              },
            };
          },
          signInWithOAuth: async (oauthOptions: unknown) => {
            oauthCalls.push(oauthOptions);

            return {
              data: { provider: "github", url: null },
              error: null,
            };
          },
          signOut: async () => {
            currentSession = null;
            listeners.forEach((listener) => listener("SIGNED_OUT", null));

            return { error: null };
          },
        },
        from: (table: string) => {
          if (table === "profiles") {
            return {
              upsert: (payload: unknown) => {
                profileUpserts.push({ table, payload });

                return {
                  select: () => ({
                    single: async () => ({
                      data: {
                        ...(payload as Record<string, unknown>),
                        created_at: "2026-04-13T00:00:00.000Z",
                        updated_at: "2026-04-13T00:00:00.000Z",
                      },
                      error: null,
                    }),
                  }),
                };
              },
            };
          }

          if (table === "collections") {
            return createCollectionsTable();
          }

          throw new Error(`Unsupported mock table: ${table}`);
        },
      } as never;
    },
    {
      initialProtectedDeleteIds: options.protectedDeleteIds ?? [],
      initialSession: options.session,
      seedCollections: initialCollections,
    },
  );
}

test("landing page renders the auth CTA", async ({ page }) => {
  await mockSupabase(page, { session: null });
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: /save useful links once, then retrieve them like a real knowledge base\./i,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /sign in with github/i }),
  ).toBeVisible();
  await expect(page.getByText(/built for developer research workflows/i)).toBeVisible();
  await expect(page.getByText(/sign in and start your first collection\./i)).toBeVisible();
});

test("landing page sign in CTA starts github oauth with the requested redirect", async ({
  page,
}) => {
  await mockSupabase(page, { session: null });
  await page.goto("/?redirectTo=%2Fapp");

  await page.getByRole("button", { name: /sign in with github/i }).click();

  const oauthCalls = await page.evaluate(() => {
    return (
      (window as typeof window & {
        __DEVLINKS_OAUTH_CALLS__?: unknown[];
      }).__DEVLINKS_OAUTH_CALLS__ ?? []
    );
  });

  expect(oauthCalls).toHaveLength(1);
  expect(oauthCalls[0]).toMatchObject({
    provider: "github",
    options: {
      redirectTo: "http://localhost:5173/app",
    },
  });
});

test("unauthenticated users are redirected away from /app", async ({ page }) => {
  await mockSupabase(page, { session: null });
  await page.goto("/app");

  await expect(page).toHaveURL(/\/\?redirectTo=%2Fapp$/);
  await expect(
    page.getByRole("button", { name: /sign in with github/i }),
  ).toBeVisible();
});

test("authenticated users can manage collections from the dashboard shell", async ({
  page,
}) => {
  await mockSupabase(page, { session: authenticatedSession });
  await page.goto("/app");

  await expect(
    page.getByRole("heading", { name: /save, search, and shape your dev links\./i }),
  ).toBeVisible();
  await expect(page.getByRole("navigation", { name: /collections/i })).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: /collections/i }).getByText("React Debugging"),
  ).toBeVisible();

  await page.getByRole("button", { name: /open create collection editor/i }).click();
  await page.getByLabel(/collection name/i).fill("CSS Layout");
  await page
    .getByLabel(/description/i)
    .fill("Grid, flexbox, and responsive layout references.");
  await page.getByRole("button", { name: "Create collection", exact: true }).click();

  await page.getByRole("button", { name: /^api\/auth/i }).click();
  await page.getByRole("button", { name: /^edit$/i }).click();
  await page.getByLabel(/collection name/i).fill("API and Auth");
  await page.getByRole("button", { name: /save changes/i }).click();

  await expect(page.getByRole("heading", { name: /api and auth/i })).toBeVisible();

  const collectionMutations = await page.evaluate(() => {
    return (
      (window as typeof window & {
        __DEVLINKS_COLLECTION_MUTATIONS__?: unknown[];
      }).__DEVLINKS_COLLECTION_MUTATIONS__ ?? []
    );
  });

  expect(collectionMutations).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ type: "insert" }),
      expect.objectContaining({
        type: "update",
        payload: expect.objectContaining({ name: "API and Auth" }),
      }),
    ]),
  );
});

test("authenticated users can trigger metadata preview from the dashboard", async ({
  page,
}) => {
  await mockSupabase(page, { session: authenticatedSession });
  await page.route("**/api/metadata", async (route) => {
    await route.fulfill({
      body: JSON.stringify({
        description: "Learn the fundamentals of React with the official docs.",
        domain: "react.dev",
        faviconUrl: "https://react.dev/favicon.ico",
        fetchStatus: "success",
        imageUrl: null,
        normalizedUrl: "https://react.dev/learn?source=guide",
        resourceType: "documentation",
        suggestedTags: ["react"],
        title: "Learn React",
        url: "https://react.dev/learn?source=guide",
      }),
      contentType: "application/json",
      status: 200,
    });
  });
  await page.goto("/app");

  await page.getByPlaceholder("https://react.dev/learn").fill("https://React.dev/learn?source=guide");
  await page.getByRole("button", { name: /fetch metadata/i }).click();

  await expect(page.getByRole("heading", { name: /learn react/i }).first()).toBeVisible();
  await expect(page.getByText("react.dev", { exact: true })).toBeVisible();
  await expect(
    page.getByText("https://react.dev/learn?source=guide"),
  ).toBeVisible();
  await expect(
    page.getByText(/learn the fundamentals of react with the official docs\./i),
  ).toBeVisible();
  await expect(page.getByText(/^success$/i)).toBeVisible();
  await expect(page.getByText(/^react$/i)).toBeVisible();
});

test("non-empty collections cannot be deleted", async ({ page }) => {
  await mockSupabase(page, {
    protectedDeleteIds: ["collection-1"],
    session: authenticatedSession,
  });
  await page.goto("/app");

  await page.getByRole("button", { name: /^react debugging/i }).click();
  await page.getByRole("button", { name: /^edit$/i }).click();
  await page.getByRole("button", { name: /delete collection/i }).click();

  await expect(
    page.getByText(
      /this collection cannot be deleted until all bookmarks inside it are removed\./i,
    ),
  ).toBeVisible();
});

test("authenticated users can open the dashboard and sign out", async ({ page }) => {
  await mockSupabase(page, { session: authenticatedSession });
  await page.goto("/app");

  await expect(page.getByText("harshit@example.com")).toBeVisible();
  await expect(
    page.getByPlaceholder(/search bookmarks, urls, descriptions, and tags/i),
  ).toBeVisible();

  const profileUpserts = await page.evaluate(() => {
    return (
      (window as typeof window & {
        __DEVLINKS_PROFILE_UPSERTS__?: unknown[];
      }).__DEVLINKS_PROFILE_UPSERTS__ ?? []
    );
  });

  expect(profileUpserts).toHaveLength(1);
  expect(profileUpserts[0]).toMatchObject({
    table: "profiles",
    payload: {
      id: authenticatedSession.user.id,
      email: authenticatedSession.user.email,
      display_name: authenticatedSession.user.user_metadata.full_name,
    },
  });

  await page.getByRole("button", { name: /sign out/i }).click();

  await expect(page).toHaveURL(/\/\?redirectTo=%2Fapp$/);
  await expect(
    page.getByRole("button", { name: /sign in with github/i }),
  ).toBeVisible();
});
