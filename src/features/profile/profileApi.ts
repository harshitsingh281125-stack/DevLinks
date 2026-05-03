import { baseApi } from "@/api/baseApi";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/lib/types";

// ─── Row shape ────────────────────────────────────────────────────────────────

type ProfileRow = {
  id: string;
  email: string | null;
  github_username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  website_url: string | null;
  twitter_handle: string | null;
  linkedin_url: string | null;
  created_at: string;
  updated_at: string;
};

export function mapProfileRow(row: ProfileRow): Profile {
  return {
    id: row.id,
    email: row.email,
    githubUsername: row.github_username,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    bio: row.bio,
    location: row.location,
    websiteUrl: row.website_url,
    twitterHandle: row.twitter_handle,
    linkedinUrl: row.linkedin_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ─── Public types ─────────────────────────────────────────────────────────────

export type ProfileUpdatePayload = {
  displayName: string | null;
  bio: string | null;
  location: string | null;
  websiteUrl: string | null;
  twitterHandle: string | null;
  linkedinUrl: string | null;
  githubUsername: string | null;
  avatarUrl: string | null;
};

// ─── API ──────────────────────────────────────────────────────────────────────

export const profileApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyProfile: builder.query<Profile, string>({
      queryFn: async (userId) => {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();

        if (error) return { error: { message: error.message } };
        return { data: mapProfileRow(data as ProfileRow) };
      },
      providesTags: (_result, _error, userId) => [{ type: "Profile" as const, id: userId }],
    }),

    updateMyProfile: builder.mutation<Profile, { userId: string; payload: ProfileUpdatePayload }>({
      queryFn: async ({ userId, payload }) => {
        const { data, error } = await supabase
          .from("profiles")
          .update({
            display_name: payload.displayName,
            bio: payload.bio,
            location: payload.location,
            website_url: payload.websiteUrl,
            twitter_handle: payload.twitterHandle,
            linkedin_url: payload.linkedinUrl,
            github_username: payload.githubUsername,
            avatar_url: payload.avatarUrl,
          })
          .eq("id", userId)
          .select()
          .single();

        if (error) return { error: { message: error.message } };
        return { data: mapProfileRow(data as ProfileRow) };
      },
      invalidatesTags: (_result, _error, { userId }) => [{ type: "Profile" as const, id: userId }],
    }),

    uploadAvatar: builder.mutation<string, { userId: string; file: File }>({
      queryFn: async ({ userId, file }) => {
        const ext = file.name.split(".").pop() ?? "jpg";
        const path = `${userId}/avatar.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(path, file, { upsert: true, contentType: file.type });

        if (uploadError) return { error: { message: uploadError.message } };

        const { data } = supabase.storage.from("avatars").getPublicUrl(path);
        // Bust the CDN cache by appending a timestamp query param
        const publicUrl = `${data.publicUrl}?t=${Date.now()}`;
        return { data: publicUrl };
      },
    }),
  }),
});

export const {
  useGetMyProfileQuery,
  useUpdateMyProfileMutation,
  useUploadAvatarMutation,
} = profileApi;
