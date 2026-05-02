#!/usr/bin/env tsx
// ─── DevLinks demo seed script ────────────────────────────────────────────────
//
// Seeds the 3 launch-ready public collections into any running Supabase
// instance (local or production) using the Admin API (service role).
//
// Usage:
//   npx tsx scripts/seed-demo.ts
//
// Required environment variables:
//   SUPABASE_URL              — e.g. http://localhost:54321  or  https://xxx.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY — service-role key (never expose publicly)
//
// Optional:
//   SEED_DEMO_PASSWORD — password for the demo account (default: a random UUID)
//
// The script is fully idempotent:
//   - createUser uses the fixed demo user ID and skips if it already exists.
//   - Collections and bookmarks use upsert (onConflict: id) so re-running is safe.

import { createClient } from "@supabase/supabase-js";
import {
  ALL_DEMO_BOOKMARKS,
  DEMO_COLLECTIONS,
  DEMO_DISPLAY_NAME,
  DEMO_GITHUB_USERNAME,
  DEMO_USER_EMAIL,
  DEMO_USER_ID,
} from "../src/seed/demoData.js";

// ─── Config ───────────────────────────────────────────────────────────────────

const supabaseUrl = process.env["SUPABASE_URL"];
const serviceRoleKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.\n" +
    "For local dev: copy them from `supabase status`.",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ok(label: string) {
  console.log(`  ✓ ${label}`);
}

function fail(label: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`  ✗ ${label}: ${message}`);
}

// ─── Step 1: demo user ────────────────────────────────────────────────────────

async function seedUser() {
  console.log("\n[1/3] Upserting demo user…");

  // Try to create the user with the fixed UUID.
  const { data, error } = await supabase.auth.admin.createUser({
    user_metadata: {
      user_name: DEMO_GITHUB_USERNAME,
      full_name: DEMO_DISPLAY_NAME,
      avatar_url: "https://avatars.githubusercontent.com/u/0",
    },
    email: DEMO_USER_EMAIL,
    password: process.env["SEED_DEMO_PASSWORD"] ?? crypto.randomUUID(),
    email_confirm: true,
    // Supabase Admin API does not expose a way to set the UUID directly
    // in all SDK versions. If your project uses a version that supports
    // the `id` field, add: id: DEMO_USER_ID,
  });

  if (error) {
    if (error.message.includes("already been registered")) {
      ok(`demo user already exists (${DEMO_USER_EMAIL})`);
    } else {
      fail("createUser", error);
      process.exit(1);
    }
    return;
  }

  ok(`created demo user: ${data.user.id} (${DEMO_USER_EMAIL})`);
}

// ─── Step 2: collections ──────────────────────────────────────────────────────

async function seedCollections(userId: string) {
  console.log("\n[2/3] Upserting collections…");

  const rows = DEMO_COLLECTIONS.map((c) => ({
    id: c.id,
    user_id: userId,
    name: c.name,
    description: c.description,
    slug: c.slug,
    is_public: true,
  }));

  const { error } = await supabase
    .from("collections")
    .upsert(rows, { onConflict: "id" });

  if (error) {
    fail("upsert collections", error);
    process.exit(1);
  }

  for (const c of DEMO_COLLECTIONS) {
    ok(`${c.name} (${c.slug}) — ${c.bookmarks.length} bookmarks`);
  }
}

// ─── Step 3: bookmarks ────────────────────────────────────────────────────────

async function seedBookmarks(userId: string) {
  console.log("\n[3/3] Upserting bookmarks…");

  const rows = ALL_DEMO_BOOKMARKS.map((b) => ({
    id: b.id,
    user_id: userId,
    collection_id: b.collectionId,
    title: b.title,
    url: b.url,
    // normalized_url and search_text are computed by the DB trigger on INSERT/UPDATE.
    normalized_url: "",
    description: b.description,
    domain: b.domain,
    favicon_url: b.faviconUrl,
    image_url: b.imageUrl,
    resource_type: b.resourceType,
    tags: b.tags,
  }));

  // Upsert in one batch; the trigger computes normalized_url + search_text.
  const { error } = await supabase
    .from("bookmarks")
    .upsert(rows, { onConflict: "id" });

  if (error) {
    fail("upsert bookmarks", error);
    process.exit(1);
  }

  ok(`${rows.length} bookmarks upserted`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("DevLinks demo seed");
  console.log(`  Target: ${supabaseUrl}`);

  // Step 1 — user
  await seedUser();

  // Resolve the actual user ID (may differ from DEMO_USER_ID if the SDK
  // version doesn't support setting the UUID directly).
  const { data: users, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    fail("listUsers", listError);
    process.exit(1);
  }

  const demoUser = users.users.find((u) => u.email === DEMO_USER_EMAIL);
  if (!demoUser) {
    console.error("Error: could not find demo user after create.");
    process.exit(1);
  }

  const userId = demoUser.id;

  // Ensure the profile row exists (needed for the FK from collections).
  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: userId,
      email: DEMO_USER_EMAIL,
      github_username: DEMO_GITHUB_USERNAME,
      display_name: DEMO_DISPLAY_NAME,
      avatar_url: "https://avatars.githubusercontent.com/u/0",
    },
    { onConflict: "id" },
  );
  if (profileError) {
    fail("upsert profile", profileError);
    process.exit(1);
  }

  // Step 2 — collections (use the resolved userId, not the fixed DEMO_USER_ID)
  await seedCollections(userId);

  // Step 3 — bookmarks
  await seedBookmarks(userId);

  console.log("\nSeed complete.");
  console.log("  Public collection URLs (once the app is running):");
  for (const c of DEMO_COLLECTIONS) {
    console.log(`    /public/collections/${c.slug}`);
  }
}

void main();
