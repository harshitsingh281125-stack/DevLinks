import { expect, test } from "@playwright/test";
import { authenticatedSession, mockSupabase, readMutations, readOauthCalls } from "./support/mockSupabase";

// ─── Landing ──────────────────────────────────────────────────────────────────

test("landing page renders the hero and sign-in CTA", async ({ page }) => {
  await mockSupabase(page, { session: null });
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1, name: /save a link once\. find it in seconds\./i })).toBeVisible();
  await expect(page.getByRole("button", { name: /sign in with github/i }).first()).toBeVisible();
});

test("the landing demo runs the real matching and tagging rules", async ({ page }) => {
  await mockSupabase(page, { session: null });
  await page.goto("/");

  const input = page.getByLabel("Try a link");
  await input.fill("https://github.com/vitejs/vite/?utm_source=x");

  const readout = page.locator(".readout");
  await expect(readout.getByText("github.com/vitejs/vite", { exact: true })).toBeVisible();
  await expect(readout.getByText("Repo", { exact: true })).toBeVisible();
  await expect(readout.getByText("vite", { exact: true })).toBeVisible();
  await expect(readout.getByText("?utm_source=x")).toBeVisible();
});

test("sign-in CTA starts GitHub OAuth with the requested redirect", async ({ page }) => {
  await mockSupabase(page, { session: null });
  await page.goto("/?redirectTo=%2Fapp");

  await page.getByRole("button", { name: /sign in with github/i }).first().click();

  const oauthCalls = await readOauthCalls(page);
  expect(oauthCalls).toHaveLength(1);
  expect(oauthCalls[0]).toMatchObject({ provider: "github", options: { redirectTo: expect.stringMatching(/\/app$/) } });
});

test("unauthenticated users are redirected away from /app", async ({ page }) => {
  await mockSupabase(page, { session: null });
  await page.goto("/app");

  await expect(page).toHaveURL(/\/\?redirectTo=%2Fapp$/);
  await expect(page.getByRole("button", { name: /sign in with github/i }).first()).toBeVisible();
});

test("the theme switch pins light and dark", async ({ page }) => {
  await mockSupabase(page, { session: null });
  await page.goto("/");

  const footer = page.locator(".site-footer");
  await footer.getByRole("radio", { name: "Dark theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await footer.getByRole("radio", { name: "Match system theme" }).click();
  await expect(page.locator("html")).not.toHaveAttribute("data-theme", /.+/);
});

// ─── Dashboard ────────────────────────────────────────────────────────────────

test("users can create and rename collections", async ({ page }) => {
  await mockSupabase(page, { session: authenticatedSession });
  await page.goto("/app");

  const nav = page.getByRole("navigation", { name: "Collections", exact: true });
  await expect(nav.getByText("React Debugging")).toBeVisible();

  await nav.getByRole("button", { name: "New collection" }).click();
  await page.getByLabel(/collection name/i).fill("CSS Layout");
  await page.getByLabel(/description/i).fill("Grid, flexbox, and responsive layout references.");
  await page.getByRole("button", { name: "Create collection", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1, name: "CSS Layout" })).toBeVisible();

  await nav.getByRole("button", { name: /^api\/auth/i }).click();
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await page.getByLabel(/collection name/i).fill("API and Auth");
  await page.getByRole("button", { name: /save changes/i }).click();
  await expect(page.getByRole("heading", { level: 1, name: "API and Auth" })).toBeVisible();

  const mutations = await readMutations(page);
  expect(mutations).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ table: "collections", type: "insert" }),
      expect.objectContaining({
        table: "collections",
        type: "update",
        payload: expect.objectContaining({ name: "API and Auth" }),
      }),
    ]),
  );
});

test("pasting a link opens the preview and saves a bookmark", async ({ page }) => {
  await mockSupabase(page, { session: authenticatedSession });
  await page.route("**/api/metadata", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        url: "https://react.dev/learn?source=guide",
        normalizedUrl: "https://react.dev/learn?source=guide",
        title: "Learn React",
        description: "Learn the fundamentals of React with the official docs.",
        domain: "react.dev",
        faviconUrl: null,
        imageUrl: null,
        resourceType: "documentation",
        suggestedTags: ["react"],
        fetchStatus: "success",
      }),
    }),
  );
  await page.goto("/app");

  await page.getByLabel("Link to save").fill("https://React.dev/learn?source=guide");
  await page.getByRole("button", { name: /fetch preview/i }).click();

  const dialog = page.getByRole("dialog", { name: "Save bookmark" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel("Title")).toHaveValue("Learn React");
  await expect(dialog.getByText("Detected: Docs")).toBeVisible();
  await expect(dialog.getByText("react", { exact: true })).toBeVisible();

  await dialog.getByRole("button", { name: "Save bookmark" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("status").filter({ hasText: "Saved to React Debugging" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 3, name: "Learn React" })).toBeVisible();
});

test("collections that still hold bookmarks can't be deleted", async ({ page }) => {
  await mockSupabase(page, { session: authenticatedSession, seed: { withBookmarks: true } });
  await page.goto("/app");

  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await page.getByRole("button", { name: "Delete…" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Delete collection" }).click();

  await expect(
    page.getByText(/this collection cannot be deleted until all bookmarks inside it are removed\./i),
  ).toBeVisible();
  await expect(page.getByRole("dialog", { name: "Collection settings" })).toBeVisible();
});

test("filters narrow the list and are reflected in the URL", async ({ page }) => {
  await mockSupabase(page, { session: authenticatedSession, seed: { withBookmarks: true } });
  await page.goto("/app");

  await expect(page.locator(".bm-card")).toHaveCount(10);
  await page.getByRole("group", { name: "Filter by type" }).getByRole("button", { name: /^repo/i }).click();
  await expect(page).toHaveURL(/type=repo/);
  await expect(page.locator(".bm-card")).toHaveCount(1);
  await page.getByRole("button", { name: "Clear filters" }).first().click();
  await expect(page.locator(".bm-card")).toHaveCount(10);
});

test("users can open the account menu and sign out", async ({ page }) => {
  await mockSupabase(page, { session: authenticatedSession });
  await page.goto("/app");

  await page.getByRole("button", { name: /harshit singh/i }).click();
  await expect(page.getByText("harshit@example.com")).toBeVisible();

  const mutations = await readMutations(page);
  expect(mutations).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        table: "profiles",
        type: "upsert",
        payload: expect.objectContaining({ id: authenticatedSession.user.id, email: authenticatedSession.user.email }),
      }),
    ]),
  );

  await page.getByRole("menuitem", { name: /sign out/i }).click();
  await expect(page).toHaveURL(/\/\?redirectTo=%2Fapp/);
});

// ─── Public pages ─────────────────────────────────────────────────────────────

test("public collections render for signed-out visitors, unknown slugs don't", async ({ page }) => {
  await mockSupabase(page, { session: null });
  await page.goto("/public/collections/react-debugging");

  await expect(page.getByRole("heading", { level: 1, name: "React Debugging" })).toBeVisible();
  await expect(page.getByText(/curated by/i)).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "React Developer Tools" })).toBeVisible();

  await page.goto("/public/collections/does-not-exist");
  await expect(page.getByRole("heading", { level: 1, name: /isn’t public/i })).toBeVisible();
});

test("the landing page lists public collections from the database", async ({ page }) => {
  await mockSupabase(page, { session: null });
  await page.goto("/");

  const feed = page.locator("#explore");
  await expect(feed.getByRole("link", { name: /react debugging/i })).toBeVisible();
  await expect(feed.getByRole("link", { name: /css layout/i })).toBeVisible();
  await expect(feed.getByRole("link", { name: /api \/ auth/i })).toBeVisible();
  await expect(feed.getByText("DevLinks Demo").first()).toBeVisible();

  await feed.getByRole("link", { name: /css layout/i }).click();
  await expect(page).toHaveURL(/\/public\/collections\/css-layout$/);
  await expect(page.getByRole("heading", { level: 1, name: "CSS Layout" })).toBeVisible();
});

test("the explore page searches public collections and keeps the query in the URL", async ({ page }) => {
  await mockSupabase(page, { session: null });
  await page.goto("/explore");

  await expect(page.locator(".feed-row")).toHaveCount(3);
  await page.getByLabel("Search public collections").fill("flexbox");
  await expect(page).toHaveURL(/q=flexbox/);
  await expect(page.locator(".feed-row")).toHaveCount(1);
  await expect(page.getByRole("link", { name: /css layout/i })).toBeVisible();

  await page.getByLabel("Search public collections").fill("nothing-matches-this");
  await expect(page.getByText(/nothing matches/i)).toBeVisible();

  await page.reload();
  await expect(page.getByLabel("Search public collections")).toHaveValue("nothing-matches-this");
});

// ─── Roadmaps ─────────────────────────────────────────────────────────────────

const stepTitles = (page: import("@playwright/test").Page) =>
  page.locator(".rm-row .rm-title a").allInnerTexts();

test("a collection can be switched to a roadmap", async ({ page }) => {
  await mockSupabase(page, { session: authenticatedSession, seed: { withBookmarks: true } });
  await page.goto("/app");
  await expect(page.locator(".bm-card")).toHaveCount(10);

  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await page.getByRole("switch", { name: "Roadmap" }).click();
  await page.getByRole("button", { name: /save changes/i }).click();

  await expect(page.getByText(/roadmap · 10 steps/i)).toBeVisible();
  await expect(page.locator(".rm-row")).toHaveCount(10);
  await expect(page.locator(".rm-step").first()).toHaveText("1");
  const mutations = await readMutations(page);
  expect(mutations).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ table: "collections", type: "update", payload: expect.objectContaining({ is_roadmap: true }) }),
    ]),
  );
});

test("roadmap steps can be reordered by button, keyboard, and drag", async ({ page }) => {
  await mockSupabase(page, { session: authenticatedSession, seed: { withBookmarks: true, roadmap: true } });
  await page.goto("/app");
  await expect(page.locator(".rm-row")).toHaveCount(10);
  const before = await stepTitles(page);

  // Button: move step 1 down.
  await page.getByRole("button", { name: `Move ${before[0]} down` }).click();
  expect((await stepTitles(page)).slice(0, 2)).toEqual([before[1], before[0]]);

  // Keyboard: focus step 3's handle and press ArrowUp twice; focus follows it.
  const handle = page.getByRole("button", { name: `Reorder step 3: ${before[2]}` });
  await handle.focus();
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("ArrowUp");
  expect((await stepTitles(page))[0]).toBe(before[2]);
  await expect(page.getByRole("button", { name: `Reorder step 1: ${before[2]}` })).toBeFocused();

  // The batched save sends the full new order once.
  await expect
    .poll(async () => (await readMutations(page)).filter((m) => m.type === "reorder").length)
    .toBe(1);
  const reorder = (await readMutations(page)).find((m) => m.type === "reorder") as { payload: { ids: string[] } };
  expect(reorder.payload.ids.slice(0, 3)).toEqual(["bm-3", "bm-2", "bm-1"]);

  // Drag: last step onto the first row.
  const titles = await stepTitles(page);
  const last = titles[titles.length - 1];
  // Synthetic mouse drags are throttled unpredictably in headless Chromium, so
  // replay the event sequence a browser sends, sharing one DataTransfer.
  const grip = page.getByRole("button", { name: `Reorder step 10: ${last}` });
  await grip.dispatchEvent("pointerdown");
  await page.evaluate(() => {
    const rows = document.querySelectorAll<HTMLElement>(".rm-row");
    const source = rows[rows.length - 1];
    const target = rows[0];
    const rect = target.getBoundingClientRect();
    const dataTransfer = new DataTransfer();
    const fire = (el: HTMLElement, type: string) =>
      el.dispatchEvent(new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer, clientX: rect.left + 40, clientY: rect.top + 4 }));
    fire(source, "dragstart");
    fire(target, "dragover");
    fire(target, "drop");
    fire(source, "dragend");
  });
  await expect.poll(async () => (await stepTitles(page))[0]).toBe(last);
  await expect
    .poll(async () => (await readMutations(page)).filter((m) => m.type === "reorder").length)
    .toBe(2);

  // A cancelled drag (Escape / released outside the list) puts the order back.
  const beforeCancel = await stepTitles(page);
  await page.locator(".rm-handle").nth(2).dispatchEvent("pointerdown");
  await page.evaluate(() => {
    const rows = document.querySelectorAll<HTMLElement>(".rm-row");
    const rect = rows[0].getBoundingClientRect();
    const dataTransfer = new DataTransfer();
    const fire = (el: HTMLElement, type: string) =>
      el.dispatchEvent(new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer, clientX: rect.left + 40, clientY: rect.top + 4 }));
    fire(rows[2], "dragstart");
    fire(rows[0], "dragover");
    fire(rows[2], "dragend"); // no drop: released outside the list
  });
  await expect.poll(() => stepTitles(page)).toEqual(beforeCancel);
});

test("readers follow a public roadmap and their progress is remembered", async ({ page }) => {
  await mockSupabase(page, { session: null, seed: { roadmap: true } });
  await page.goto("/public/collections/react-debugging");

  await expect(page.getByText("Roadmap", { exact: true })).toBeVisible();
  await expect(page.locator(".path-step")).toHaveCount(8);
  await expect(page.locator(".path-step").first()).toHaveClass(/is-next/);

  await page.locator(".path-step").first().getByRole("button", { name: "Mark as done" }).click();
  await expect(page.getByText("1 of 8 steps done")).toBeVisible();
  await expect(page.locator(".path-step").nth(1)).toHaveClass(/is-next/);
  await expect(page.getByRole("button", { name: "Continue with step 2" })).toBeVisible();

  await page.reload();
  await expect(page.getByText("1 of 8 steps done")).toBeVisible();
  await expect(page.getByRole("checkbox", { name: /step 1, .*: done/i })).toBeChecked();

  await page.getByRole("button", { name: "Reset" }).click();
  await expect(page.getByText("8 steps, in order.")).toBeVisible();
});
