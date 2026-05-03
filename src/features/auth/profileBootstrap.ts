import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/lib/types";
import { supabase } from "@/lib/supabase";

type ProfileUpsertPayload = {
  id: string;
  email: string | null;
  github_username: string | null;
  display_name: string | null;
  avatar_url: string | null;
};

function getGithubUsername(user: User) {
  const metadata = user.user_metadata;

  if (typeof metadata.user_name === "string" && metadata.user_name.length > 0) {
    return metadata.user_name;
  }

  if (
    typeof metadata.preferred_username === "string" &&
    metadata.preferred_username.length > 0
  ) {
    return metadata.preferred_username;
  }

  return null;
}

function getDisplayName(user: User) {
  const metadata = user.user_metadata;

  if (typeof metadata.full_name === "string" && metadata.full_name.length > 0) {
    return metadata.full_name;
  }

  if (typeof metadata.name === "string" && metadata.name.length > 0) {
    return metadata.name;
  }

  return null;
}

function getAvatarUrl(user: User) {
  const metadata = user.user_metadata;

  return typeof metadata.avatar_url === "string" && metadata.avatar_url.length > 0
    ? metadata.avatar_url
    : null;
}

export function buildProfileUpsertPayload(user: User): ProfileUpsertPayload {
  return {
    id: user.id,
    email: user.email ?? null,
    github_username: getGithubUsername(user),
    display_name: getDisplayName(user),
    avatar_url: getAvatarUrl(user),
  };
}

export function mapProfileRow(row: {
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
}): Profile {
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

export type SyncProfileResult = {
  profile: Profile;
  /**
   * True when the upsert created a brand-new row (i.e. this is the user's
   * first sign-in). Detected by `created_at === updated_at`: on INSERT both
   * timestamps are set to the same `now()` value; on UPDATE the trigger
   * advances `updated_at` so they diverge.
   */
  isNewUser: boolean;
};

export async function syncProfile(user: User): Promise<SyncProfileResult> {
  const payload = buildProfileUpsertPayload(user);

  const { data, error } = await supabase
    .from("profiles")
    .upsert(payload, { onConflict: "id" })
    .select()
    .single();

  if (error) {
    throw error;
  }

  const profile = mapProfileRow(data);
  const isNewUser = profile.createdAt === profile.updatedAt;
  return { profile, isNewUser };
}
