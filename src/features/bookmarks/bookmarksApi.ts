import { baseApi } from "@/api/baseApi";
import { supabase } from "@/lib/supabase";
import type { Bookmark, ResourceType, SearchFilters } from "@/lib/types";
import { normalizeSearchQuery } from "./searchUtils";

// ─── Row shape returned by Supabase ──────────────────────────────────────────

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

// ─── URL canonicalization ─────────────────────────────────────────────────────
// Mirrors the Postgres `normalize_bookmark_url` function used by the DB trigger
// so the client and DB agree on the normalized form for duplicate detection.

export function canonicalizeUrl(url: string): string {
  return url
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/^www\d*\./, "")
    .replace(/[#?].*$/, "")
    .replace(/\/+$/, "");
}

// ─── Row mapper ───────────────────────────────────────────────────────────────

export function mapBookmarkRow(row: BookmarkRow): Bookmark {
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

// ─── API types ────────────────────────────────────────────────────────────────

export type CreateBookmarkInput = {
  userId: string;
  collectionId: string;
  title: string;
  url: string;
  description: string | null;
  domain: string | null;
  faviconUrl: string | null;
  imageUrl: string | null;
  resourceType: ResourceType | null;
  tags: string[];
};

export type CreateBookmarkResult =
  | { kind: "created"; bookmark: Bookmark }
  | { kind: "duplicate"; existing: Bookmark };

export type UpdateBookmarkInput = {
  id: string;
  userId: string;
  collectionId: string;
  title: string;
  description: string | null;
  resourceType: ResourceType | null;
  tags: string[];
};

export type DeleteBookmarkInput = {
  id: string;
  userId: string;
  collectionId: string;
  filters: SearchFilters;
};

// ─── RTK Query endpoints ──────────────────────────────────────────────────────

export const bookmarksApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getBookmarks: builder.query<
      Bookmark[],
      { filters: SearchFilters; userId: string }
    >({
      queryFn: async ({ filters, userId }) => {
        let query = supabase
          .from("bookmarks")
          .select(BOOKMARK_SELECT)
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (filters.collectionId) {
          query = query.eq("collection_id", filters.collectionId);
        }

        if (filters.resourceType) {
          query = query.eq("resource_type", filters.resourceType);
        }

        if (filters.tag) {
          query = query.contains("tags", [filters.tag]);
        }

        if (filters.query.trim()) {
          query = query.textSearch("search_text", normalizeSearchQuery(filters.query), {
            type: "websearch",
            config: "english",
          });
        }

        const { data, error } = await query;
        if (error) return { error: { message: error.message } };
        return { data: (data ?? []).map((row) => mapBookmarkRow(row as BookmarkRow)) };
      },
      providesTags: (result) => [
        { type: "Bookmarks" as const, id: "LIST" },
        ...(result ?? []).map((b) => ({ type: "Bookmarks" as const, id: b.id })),
      ],
    }),
    createBookmark: builder.mutation<CreateBookmarkResult, CreateBookmarkInput>({
      queryFn: async ({
        userId,
        collectionId,
        title,
        url,
        description,
        domain,
        faviconUrl,
        imageUrl,
        resourceType,
        tags,
      }) => {
        // The DB trigger normalizes url → normalized_url before the constraint
        // is checked. We also compute it client-side so we can use it in the
        // duplicate lookup query if the insert fails.
        const normalizedUrl = canonicalizeUrl(url);

        const { data: inserted, error: insertError } = await supabase
          .from("bookmarks")
          .insert({
            user_id: userId,
            collection_id: collectionId,
            title,
            url,
            normalized_url: normalizedUrl,
            description,
            domain,
            favicon_url: faviconUrl,
            image_url: imageUrl,
            resource_type: resourceType,
            tags,
          })
          .select(BOOKMARK_SELECT)
          .single();

        if (!insertError && inserted) {
          return {
            data: { kind: "created", bookmark: mapBookmarkRow(inserted as BookmarkRow) },
          };
        }

        // 23505 = unique_violation: (user_id, normalized_url) already exists.
        // Fetch the conflicting row so the UI can show a clear duplicate path
        // instead of silently discarding the save attempt.
        if (insertError?.code === "23505") {
          const { data: existing, error: fetchError } = await supabase
            .from("bookmarks")
            .select(BOOKMARK_SELECT)
            .eq("user_id", userId)
            .eq("normalized_url", normalizedUrl)
            .single();

          if (!fetchError && existing) {
            return {
              data: { kind: "duplicate", existing: mapBookmarkRow(existing as BookmarkRow) },
            };
          }

          return {
            error: {
              message:
                "This URL is already saved. The existing bookmark could not be loaded.",
            },
          };
        }

        return {
          error: { message: insertError?.message ?? "Bookmark could not be saved." },
        };
      },
      // Only invalidate the bookmark list when a row was actually created.
      invalidatesTags: (result) =>
        result?.kind === "created" ? [{ type: "Bookmarks" as const, id: "LIST" }] : [],
    }),
    updateBookmark: builder.mutation<Bookmark, UpdateBookmarkInput>({
      queryFn: async ({ id, userId, collectionId, title, description, resourceType, tags }) => {
        const { data, error } = await supabase
          .from("bookmarks")
          .update({ collection_id: collectionId, title, description, resource_type: resourceType, tags })
          .eq("id", id)
          .eq("user_id", userId)
          .select(BOOKMARK_SELECT)
          .single();

        if (error) return { error: { message: error.message } };
        if (!data) return { error: { message: "Bookmark not found." } };
        return { data: mapBookmarkRow(data as BookmarkRow) };
      },
      invalidatesTags: (result, _error, { id }) =>
        result
          ? [{ type: "Bookmarks" as const, id }, { type: "Bookmarks" as const, id: "LIST" }]
          : [],
    }),
    getAllBookmarks: builder.query<Bookmark[], string>({
      queryFn: async (userId) => {
        const { data, error } = await supabase
          .from("bookmarks")
          .select(BOOKMARK_SELECT)
          .eq("user_id", userId)
          .order("created_at", { ascending: false });
        if (error) return { error: { message: error.message } };
        return { data: (data ?? []).map((row) => mapBookmarkRow(row as BookmarkRow)) };
      },
      providesTags: [{ type: "Bookmarks" as const, id: "LIST" }],
    }),
    deleteBookmark: builder.mutation<{ id: string }, DeleteBookmarkInput>({
      queryFn: async ({ id, userId }) => {
        const { error } = await supabase
          .from("bookmarks")
          .delete()
          .eq("id", id)
          .eq("user_id", userId);

        if (error) return { error: { message: error.message } };
        return { data: { id } };
      },
      // Optimistically remove the bookmark from the list immediately so the UI
      // updates before the server round-trip completes. On failure the patch is
      // undone and the bookmark reappears.
      onQueryStarted: async ({ filters, id, userId }, { dispatch, queryFulfilled }) => {
        const patch = dispatch(
          bookmarksApi.util.updateQueryData(
            "getBookmarks",
            { filters, userId },
            (draft) => {
              const idx = draft.findIndex((b) => b.id === id);
              if (idx !== -1) draft.splice(idx, 1);
            },
          ),
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Bookmarks" as const, id },
        { type: "Bookmarks" as const, id: "LIST" },
      ],
    }),
  }),
});

export const {
  useCreateBookmarkMutation,
  useDeleteBookmarkMutation,
  useGetBookmarksQuery,
  useGetAllBookmarksQuery,
  useUpdateBookmarkMutation,
} = bookmarksApi;
