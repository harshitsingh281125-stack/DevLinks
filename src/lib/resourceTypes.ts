import { RESOURCE_TYPES, type ResourceType } from "./types";

export const RESOURCE_TYPE_LABELS: Record<(typeof RESOURCE_TYPES)[number], string> = {
  article: "Article",
  video: "Video",
  repo: "Repo",
  documentation: "Docs",
  tool: "Tool",
  course: "Course",
  podcast: "Podcast",
  other: "Other",
};

export function resourceTypeLabel(type: ResourceType | null | undefined): string | null {
  if (!type) return null;
  return RESOURCE_TYPE_LABELS[type as keyof typeof RESOURCE_TYPE_LABELS] ?? type;
}
