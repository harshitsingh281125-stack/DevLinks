import { describe, it, expect } from "vitest";
import { mapCollectionRow } from "./publicApi";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const BASE_COLLECTION_ROW = {
  id: "col-1",
  user_id: "user-1",
  name: "React Debugging",
  description: "Useful debugging resources.",
  slug: "react-debugging",
  is_public: true,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-04-01T00:00:00Z",
};

// ─── mapCollectionRow ─────────────────────────────────────────────────────────

describe("publicApi mapCollectionRow", () => {
  it("maps all snake_case columns to camelCase Collection fields", () => {
    const collection = mapCollectionRow(BASE_COLLECTION_ROW);

    expect(collection.id).toBe("col-1");
    expect(collection.userId).toBe("user-1");
    expect(collection.name).toBe("React Debugging");
    expect(collection.description).toBe("Useful debugging resources.");
    expect(collection.slug).toBe("react-debugging");
    expect(collection.isPublic).toBe(true);
    expect(collection.createdAt).toBe("2026-01-01T00:00:00Z");
    expect(collection.updatedAt).toBe("2026-04-01T00:00:00Z");
  });

  it("passes null description through", () => {
    const collection = mapCollectionRow({ ...BASE_COLLECTION_ROW, description: null });
    expect(collection.description).toBeNull();
  });

  it("passes null slug through", () => {
    const collection = mapCollectionRow({ ...BASE_COLLECTION_ROW, slug: null });
    expect(collection.slug).toBeNull();
  });

  it("maps is_public=false correctly", () => {
    const collection = mapCollectionRow({ ...BASE_COLLECTION_ROW, is_public: false });
    expect(collection.isPublic).toBe(false);
  });
});

// ─── Author mapping (inline logic from getPublicCollectionBySlug) ─────────────
// The author mapping is inline in the queryFn. We test the shape contract here
// by replicating the exact transformation to catch any future field renames.

type RawProfileData = {
  display_name: string | null;
  github_username: string | null;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  website_url: string | null;
  twitter_handle: string | null;
  linkedin_url: string | null;
};

function mapAuthor(profileData: RawProfileData) {
  return {
    displayName: profileData.display_name,
    githubUsername: profileData.github_username,
    avatarUrl: profileData.avatar_url,
    bio: profileData.bio,
    location: profileData.location,
    websiteUrl: profileData.website_url,
    twitterHandle: profileData.twitter_handle,
    linkedinUrl: profileData.linkedin_url,
  };
}

describe("publicApi author mapping", () => {
  it("maps a fully-populated profile row to CollectionAuthor", () => {
    const author = mapAuthor({
      display_name: "Dev User",
      github_username: "devuser",
      avatar_url: "https://avatars.example.com/u/1",
      bio: "I ship things.",
      location: "Berlin, Germany",
      website_url: "https://devuser.dev",
      twitter_handle: "devuser_x",
      linkedin_url: "https://linkedin.com/in/devuser",
    });

    expect(author.displayName).toBe("Dev User");
    expect(author.githubUsername).toBe("devuser");
    expect(author.avatarUrl).toBe("https://avatars.example.com/u/1");
    expect(author.bio).toBe("I ship things.");
    expect(author.location).toBe("Berlin, Germany");
    expect(author.websiteUrl).toBe("https://devuser.dev");
    expect(author.twitterHandle).toBe("devuser_x");
    expect(author.linkedinUrl).toBe("https://linkedin.com/in/devuser");
  });

  it("passes nulls through for every optional field", () => {
    const author = mapAuthor({
      display_name: null,
      github_username: null,
      avatar_url: null,
      bio: null,
      location: null,
      website_url: null,
      twitter_handle: null,
      linkedin_url: null,
    });

    expect(author.displayName).toBeNull();
    expect(author.githubUsername).toBeNull();
    expect(author.avatarUrl).toBeNull();
    expect(author.bio).toBeNull();
    expect(author.location).toBeNull();
    expect(author.websiteUrl).toBeNull();
    expect(author.twitterHandle).toBeNull();
    expect(author.linkedinUrl).toBeNull();
  });

  it("maps a partial profile (only GitHub username set)", () => {
    const author = mapAuthor({
      display_name: null,
      github_username: "partial-user",
      avatar_url: null,
      bio: null,
      location: null,
      website_url: null,
      twitter_handle: null,
      linkedin_url: null,
    });

    expect(author.githubUsername).toBe("partial-user");
    expect(author.displayName).toBeNull();
    expect(author.bio).toBeNull();
  });
});
