import { baseApi } from "@/api/baseApi";
import { supabase } from "@/lib/supabase";
import type { Collection } from "@/lib/types";

type SupabaseErrorShape = {
  code?: string;
  message: string;
};

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

type CreateCollectionInput = {
  userId: string;
  name: string;
  description: string | null;
};

type UpdateCollectionInput = {
  id: string;
  userId: string;
  name: string;
  description: string | null;
};

type DeleteCollectionInput = {
  id: string;
  userId: string;
};

type ToggleCollectionVisibilityInput = {
  id: string;
  userId: string;
  /** Target visibility state. */
  isPublic: boolean;
  /**
   * Slug to persist when making public for the first time.
   * Pass null when making private — the existing slug is left intact so the
   * same share URL is reused if the collection is re-published later.
   */
  slug: string | null;
};

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

function mapSupabaseError(error: SupabaseErrorShape) {
  if (error.code === "23503") {
    return {
      message: "This collection cannot be deleted until all bookmarks inside it are removed.",
      code: error.code,
    };
  }

  return {
    message: error.message,
    code: error.code,
  };
}

export const collectionsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCollections: builder.query<Collection[], string>({
      queryFn: async (userId) => {
        const { data, error } = await supabase
          .from("collections")
          .select("id, user_id, name, description, slug, is_public, created_at, updated_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: true });

        if (error) {
          return { error: mapSupabaseError(error) };
        }

        return { data: (data ?? []).map((row) => mapCollectionRow(row as CollectionRow)) };
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((collection) => ({
                type: "Collections" as const,
                id: collection.id,
              })),
              { type: "Collections" as const, id: "LIST" },
            ]
          : [{ type: "Collections" as const, id: "LIST" }],
    }),
    createCollection: builder.mutation<Collection, CreateCollectionInput>({
      queryFn: async ({ userId, name, description }) => {
        const { data, error } = await supabase
          .from("collections")
          .insert({
            user_id: userId,
            name,
            description,
          })
          .select("id, user_id, name, description, slug, is_public, created_at, updated_at")
          .single();

        if (error) {
          return { error: mapSupabaseError(error) };
        }

        return { data: mapCollectionRow(data as CollectionRow) };
      },
      invalidatesTags: [{ type: "Collections", id: "LIST" }],
    }),
    updateCollection: builder.mutation<Collection, UpdateCollectionInput>({
      queryFn: async ({ id, userId, name, description }) => {
        const { data, error } = await supabase
          .from("collections")
          .update({
            name,
            description,
          })
          .eq("id", id)
          .eq("user_id", userId)
          .select("id, user_id, name, description, slug, is_public, created_at, updated_at")
          .single();

        if (error) {
          return { error: mapSupabaseError(error) };
        }

        return { data: mapCollectionRow(data as CollectionRow) };
      },
      invalidatesTags: (_result, _error, arg) => [
        { type: "Collections", id: arg.id },
        { type: "Collections", id: "LIST" },
      ],
    }),
    deleteCollection: builder.mutation<{ id: string }, DeleteCollectionInput>({
      queryFn: async ({ id, userId }) => {
        const { error } = await supabase
          .from("collections")
          .delete()
          .eq("id", id)
          .eq("user_id", userId)
          .select("id")
          .single();

        if (error) {
          return { error: mapSupabaseError(error) };
        }

        return { data: { id } };
      },
      invalidatesTags: (_result, _error, arg) => [
        { type: "Collections", id: arg.id },
        { type: "Collections", id: "LIST" },
      ],
    }),
    toggleCollectionVisibility: builder.mutation<
      Collection,
      ToggleCollectionVisibilityInput
    >({
      queryFn: async ({ id, userId, isPublic, slug }) => {
        // When making public: write both is_public and the generated slug.
        // When making private: only flip is_public — slug is preserved so the
        // same share URL is reused if the collection is re-published.
        const patch = isPublic
          ? { is_public: true, slug }
          : { is_public: false };

        const { data, error } = await supabase
          .from("collections")
          .update(patch)
          .eq("id", id)
          .eq("user_id", userId)
          .select("id, user_id, name, description, slug, is_public, created_at, updated_at")
          .single();

        if (error) {
          return { error: mapSupabaseError(error) };
        }

        return { data: mapCollectionRow(data as CollectionRow) };
      },
      invalidatesTags: (_result, _error, arg) => [
        { type: "Collections", id: arg.id },
        { type: "Collections", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useCreateCollectionMutation,
  useDeleteCollectionMutation,
  useGetCollectionsQuery,
  useToggleCollectionVisibilityMutation,
  useUpdateCollectionMutation,
} = collectionsApi;
