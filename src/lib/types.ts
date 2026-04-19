export const RESOURCE_TYPES = [
  "article",
  "video",
  "repo",
  "documentation",
  "tool",
  "course",
  "podcast",
  "other",
] as const;

export type KnownResourceType = (typeof RESOURCE_TYPES)[number];
export type ResourceType = KnownResourceType | (string & {});

export type MetadataFetchStatus =
  | "success"
  | "partial"
  | "invalid_url"
  | "blocked"
  | "timeout"
  | "error";

export interface Profile {
  id: string;
  email: string | null;
  githubUsername: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Collection {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  slug: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Bookmark {
  id: string;
  userId: string;
  collectionId: string;
  title: string;
  url: string;
  normalizedUrl: string;
  description: string | null;
  domain: string | null;
  faviconUrl: string | null;
  imageUrl: string | null;
  resourceType: ResourceType | null;
  tags: string[];
  searchText: string;
  createdAt: string;
  updatedAt: string;
}

export interface MetadataPreview {
  url: string;
  normalizedUrl: string;
  title: string | null;
  description: string | null;
  domain: string | null;
  faviconUrl: string | null;
  imageUrl: string | null;
  resourceType: ResourceType | null;
  suggestedTags: string[];
  fetchStatus: MetadataFetchStatus;
}

export interface SearchFilters {
  query: string;
  collectionId: string | null;
  tag: string | null;
  resourceType: ResourceType | null;
}
