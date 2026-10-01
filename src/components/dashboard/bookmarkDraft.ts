import type { ResourceType } from "@/lib/types";

// Shape and validation for the save/edit bookmark forms.

export type BookmarkDraft = {
  title: string;
  description: string;
  tags: string[];
  resourceType: ResourceType;
  collectionId: string;
};

export type BookmarkDraftErrors = Partial<Record<"title" | "collectionId", string>>;

export function validateBookmarkDraft(draft: BookmarkDraft): BookmarkDraftErrors {
  const errors: BookmarkDraftErrors = {};
  if (!draft.title.trim()) errors.title = "Give the bookmark a title so you can find it later.";
  if (!draft.collectionId) errors.collectionId = "Choose a collection to save into.";
  return errors;
}
