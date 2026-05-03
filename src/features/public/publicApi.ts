import { baseApi } from "@/api/baseApi";
import { supabase } from "@/lib/supabase";
import type { Bookmark, Collection, ResourceType } from "@/lib/types";

// ─── Author ───────────────────────────────────────────────────────────────────

export interface CollectionAuthor {
  displayName: string | null;
  githubUsername: string | null;
  avatarUrl: string | null;
  bio: string | null;
  location: string | null;
  websiteUrl: string | null;
  twitterHandle: string | null;
  linkedinUrl: string | null;
}

export interface CollectionWithAuthor extends Collection {
  author: CollectionAuthor | null;
}

// ─── Row shapes ───────────────────────────────────────────────────────────────

type CollectionRow = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  slug: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
};

type BookmarkRow = {
  id: string;
  user_id: string;
  collection_id: string;
  title: string;
  url: string;
  normalized_url: string;
  description: string | null;
  domain: string | null;
  favicon_url: string | null;
  image_url: string | null;
  resource_type: string | null;
  tags: string[];
  search_text: string;
  created_at: string;
  updated_at: string;
};

const BOOKMARK_SELECT =
  "id, user_id, collection_id, title, url, normalized_url, description, domain, favicon_url, image_url, resource_type, tags, search_text, created_at, updated_at";

// ─── Mappers ──────────────────────────────────────────────────────────────────

export function mapCollectionRow(row: CollectionRow): Collection {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description,
    slug: row.slug,
    isPublic: row.is_public,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapBookmarkRow(row: BookmarkRow): Bookmark {
  return {
    id: row.id,
    userId: row.user_id,
    collectionId: row.collection_id,
    title: row.title,
    url: row.url,
    normalizedUrl: row.normalized_url,
    description: row.description,
    domain: row.domain,
    faviconUrl: row.favicon_url,
    imageUrl: row.image_url,
    resourceType: row.resource_type as ResourceType | null,
    tags: row.tags,
    searchText: row.search_text,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ─── Public API endpoints ─────────────────────────────────────────────────────
// Both endpoints are unauthenticated reads.  Row Level Security (task 9) ensures
// only `is_public = true` collections and their bookmarks are accessible.

export const publicApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllPublicCollections: builder.query<Collection[], void>({
      queryFn: async () => {
        const { data, error } = await supabase
          .from("collections")
          .select("id, user_id, name, description, slug, is_public, created_at, updated_at")
          .eq("is_public", true)
          .not("slug", "is", null)
          .order("name", { ascending: true });

        if (error) return { error: { message: error.message } };
        return { data: (data ?? []).map((row) => mapCollectionRow(row as CollectionRow)) };
      },
      providesTags: [{ type: "Collections" as const, id: "public-list" }],
    }),

    getPublicCollectionBySlug: builder.query<CollectionWithAuthor | null, string>({
      queryFn: async (slug) => {
        const { data, error } = await supabase
          .from("collections")
          .select(
            "id, user_id, name, description, slug, is_public, created_at, updated_at, profiles(display_name, github_username, avatar_url, bio, location, website_url, twitter_handle, linkedin_url)",
          )
          .eq("slug", slug)
          .eq("is_public", true)
          .maybeSingle();

        if (error) return { error: { message: error.message } };
        if (!data) return { data: null };

        const profileData = data.profiles as unknown as {
          display_name: string | null;
          github_username: string | null;
          avatar_url: string | null;
          bio: string | null;
          location: string | null;
          website_url: string | null;
          twitter_handle: string | null;
          linkedin_url: string | null;
        } | null;

        const collection = mapCollectionRow(data as unknown as CollectionRow);
        return {
          data: {
            ...collection,
            author: profileData
              ? {
                  displayName: profileData.display_name,
                  githubUsername: profileData.github_username,
                  avatarUrl: profileData.avatar_url,
                  bio: profileData.bio,
                  location: profileData.location,
                  websiteUrl: profileData.website_url,
                  twitterHandle: profileData.twitter_handle,
                  linkedinUrl: profileData.linkedin_url,
                }
              : null,
          },
        };
      },
      providesTags: (_result, _error, slug) => [
        { type: "Collections" as const, id: `public-${slug}` },
      ],
    }),

    getPublicBookmarks: builder.query<Bookmark[], string>({
      queryFn: async (collectionId) => {
        const { data, error } = await supabase
          .from("bookmarks")
          .select(BOOKMARK_SELECT)
          .eq("collection_id", collectionId)
          .order("created_at", { ascending: false });

        if (error) return { error: { message: error.message } };
        return { data: (data ?? []).map((row) => mapBookmarkRow(row as BookmarkRow)) };
      },
      providesTags: (_result, _error, collectionId) => [
        { type: "Bookmarks" as const, id: `public-${collectionId}` },
      ],
    }),
  }),
});

export const {
  useGetAllPublicCollectionsQuery,
  useGetPublicCollectionBySlugQuery,
  useGetPublicBookmarksQuery,
} = publicApi;
