import { describe, it, expect } from "vitest";
import { mapProfileRow, buildProfileUpsertPayload } from "./profileBootstrap";
import type { User } from "@supabase/supabase-js";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const BASE_ROW = {
  id: "user-1",
  email: "dev@example.com",
  github_username: "devuser",
  display_name: "Dev User",
  avatar_url: "https://avatars.githubusercontent.com/u/1",
  bio: "I build things.",
  location: "Berlin, Germany",
  website_url: "https://devuser.dev",
  twitter_handle: "devuser",
  linkedin_url: "https://linkedin.com/in/devuser",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-04-01T00:00:00Z",
};

// ─── mapProfileRow ────────────────────────────────────────────────────────────

describe("mapProfileRow", () => {
  it("maps all snake_case columns to camelCase Profile fields", () => {
    const profile = mapProfileRow(BASE_ROW);

    expect(profile.id).toBe("user-1");
    expect(profile.email).toBe("dev@example.com");
    expect(profile.githubUsername).toBe("devuser");
    expect(profile.displayName).toBe("Dev User");
    expect(profile.avatarUrl).toBe("https://avatars.githubusercontent.com/u/1");
    expect(profile.bio).toBe("I build things.");
    expect(profile.location).toBe("Berlin, Germany");
    expect(profile.websiteUrl).toBe("https://devuser.dev");
    expect(profile.twitterHandle).toBe("devuser");
    expect(profile.linkedinUrl).toBe("https://linkedin.com/in/devuser");
    expect(profile.createdAt).toBe("2026-01-01T00:00:00Z");
    expect(profile.updatedAt).toBe("2026-04-01T00:00:00Z");
  });

  it("passes null values through for all nullable fields", () => {
    const profile = mapProfileRow({
      ...BASE_ROW,
      github_username: null,
      display_name: null,
      avatar_url: null,
      bio: null,
      location: null,
      website_url: null,
      twitter_handle: null,
      linkedin_url: null,
    });

    expect(profile.githubUsername).toBeNull();
    expect(profile.displayName).toBeNull();
    expect(profile.avatarUrl).toBeNull();
    expect(profile.bio).toBeNull();
    expect(profile.location).toBeNull();
    expect(profile.websiteUrl).toBeNull();
    expect(profile.twitterHandle).toBeNull();
    expect(profile.linkedinUrl).toBeNull();
  });

  it("produces equal createdAt and updatedAt for a brand-new row (new user detection)", () => {
    const profile = mapProfileRow({ ...BASE_ROW, updated_at: BASE_ROW.created_at });
    expect(profile.createdAt).toBe(profile.updatedAt);
  });

  it("produces different createdAt and updatedAt for a returning user", () => {
    const profile = mapProfileRow(BASE_ROW);
    expect(profile.createdAt).not.toBe(profile.updatedAt);
  });
});

// ─── buildProfileUpsertPayload ────────────────────────────────────────────────

function makeUser(meta: Record<string, unknown>): User {
  return {
    id: "user-abc",
    email: "test@example.com",
    user_metadata: meta,
    app_metadata: {},
    aud: "authenticated",
    created_at: "2026-01-01T00:00:00Z",
  } as unknown as User;
}

describe("buildProfileUpsertPayload", () => {
  it("picks user_name as github_username when present", () => {
    const payload = buildProfileUpsertPayload(makeUser({ user_name: "gh-user" }));
    expect(payload.github_username).toBe("gh-user");
  });

  it("falls back to preferred_username when user_name is absent", () => {
    const payload = buildProfileUpsertPayload(makeUser({ preferred_username: "gh-fallback" }));
    expect(payload.github_username).toBe("gh-fallback");
  });

  it("returns null github_username when neither field is present", () => {
    const payload = buildProfileUpsertPayload(makeUser({}));
    expect(payload.github_username).toBeNull();
  });

  it("picks full_name as display_name when present", () => {
    const payload = buildProfileUpsertPayload(makeUser({ full_name: "Full Name" }));
    expect(payload.display_name).toBe("Full Name");
  });

  it("falls back to name when full_name is absent", () => {
    const payload = buildProfileUpsertPayload(makeUser({ name: "Short Name" }));
    expect(payload.display_name).toBe("Short Name");
  });

  it("returns null display_name when neither field is present", () => {
    const payload = buildProfileUpsertPayload(makeUser({}));
    expect(payload.display_name).toBeNull();
  });

  it("picks avatar_url from metadata", () => {
    const payload = buildProfileUpsertPayload(
      makeUser({ avatar_url: "https://avatars.example.com/u/1" }),
    );
    expect(payload.avatar_url).toBe("https://avatars.example.com/u/1");
  });

  it("returns null avatar_url when not present in metadata", () => {
    const payload = buildProfileUpsertPayload(makeUser({}));
    expect(payload.avatar_url).toBeNull();
  });

  it("always includes the user id and email", () => {
    const user = makeUser({});
    const payload = buildProfileUpsertPayload(user);
    expect(payload.id).toBe("user-abc");
    expect(payload.email).toBe("test@example.com");
  });

  it("does not include profile-edit fields (bio, location, etc.)", () => {
    const payload = buildProfileUpsertPayload(makeUser({}));
    expect(payload).not.toHaveProperty("bio");
    expect(payload).not.toHaveProperty("location");
    expect(payload).not.toHaveProperty("website_url");
    expect(payload).not.toHaveProperty("twitter_handle");
    expect(payload).not.toHaveProperty("linkedin_url");
  });
});
