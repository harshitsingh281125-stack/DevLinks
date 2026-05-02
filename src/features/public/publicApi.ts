import { baseApi } from "@/api/baseApi";
import { supabase } from "@/lib/supabase";
import type { Bookmark, Collection, ResourceType } from "@/lib/types";

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

function mapCollectionRow(row: CollectionRow): Collection {
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

    getPublicCollectionBySlug: builder.query<Collection | null, string>({
      queryFn: async (slug) => {
        const { data, error } = await supabase
          .from("collections")
          .select("id, user_id, name, description, slug, is_public, created_at, updated_at")
          .eq("slug", slug)
          .eq("is_public", true)
          .maybeSingle();

        if (error) return { error: { message: error.message } };
        return { data: data ? mapCollectionRow(data as CollectionRow) : null };
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
