import { describe, it, expect } from "vitest";
import { mapProfileRow } from "./profileApi";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const FULL_ROW = {
  id: "user-2",
  email: "hello@example.com",
  github_username: "hellodev",
  display_name: "Hello Dev",
  avatar_url: "https://cdn.example.com/avatar.jpg",
  bio: "Full-stack engineer.",
  location: "Tokyo, Japan",
  website_url: "https://hellodev.io",
  twitter_handle: "hellodev_x",
  linkedin_url: "https://linkedin.com/in/hellodev",
  created_at: "2026-02-01T00:00:00Z",
  updated_at: "2026-05-01T00:00:00Z",
};

// ─── mapProfileRow ────────────────────────────────────────────────────────────

describe("profileApi mapProfileRow", () => {
  it("maps all fields from snake_case to camelCase", () => {
    const profile = mapProfileRow(FULL_ROW);

    expect(profile.id).toBe("user-2");
    expect(profile.email).toBe("hello@example.com");
    expect(profile.githubUsername).toBe("hellodev");
    expect(profile.displayName).toBe("Hello Dev");
    expect(profile.avatarUrl).toBe("https://cdn.example.com/avatar.jpg");
    expect(profile.bio).toBe("Full-stack engineer.");
    expect(profile.location).toBe("Tokyo, Japan");
    expect(profile.websiteUrl).toBe("https://hellodev.io");
    expect(profile.twitterHandle).toBe("hellodev_x");
    expect(profile.linkedinUrl).toBe("https://linkedin.com/in/hellodev");
    expect(profile.createdAt).toBe("2026-02-01T00:00:00Z");
    expect(profile.updatedAt).toBe("2026-05-01T00:00:00Z");
  });

  it("passes null through for every nullable field", () => {
    const profile = mapProfileRow({
      ...FULL_ROW,
      email: null,
      github_username: null,
      display_name: null,
      avatar_url: null,
      bio: null,
      location: null,
      website_url: null,
      twitter_handle: null,
      linkedin_url: null,
    });

    expect(profile.email).toBeNull();
    expect(profile.githubUsername).toBeNull();
    expect(profile.displayName).toBeNull();
    expect(profile.avatarUrl).toBeNull();
    expect(profile.bio).toBeNull();
    expect(profile.location).toBeNull();
    expect(profile.websiteUrl).toBeNull();
    expect(profile.twitterHandle).toBeNull();
    expect(profile.linkedinUrl).toBeNull();
  });

  it("preserves id and timestamps regardless of other nulls", () => {
    const profile = mapProfileRow({
      ...FULL_ROW,
      bio: null,
      location: null,
    });

    expect(profile.id).toBe("user-2");
    expect(profile.createdAt).toBe("2026-02-01T00:00:00Z");
    expect(profile.updatedAt).toBe("2026-05-01T00:00:00Z");
  });
});
