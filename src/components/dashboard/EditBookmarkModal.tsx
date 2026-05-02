import { useEffect, useRef, useState } from "react";
import { ChevronDown, Edit3, Plus, Tag, X } from "lucide-react";
import type { Bookmark, Collection, ResourceType } from "@/lib/types";
import { RESOURCE_TYPES } from "@/lib/types";
import { useFocusTrap } from "@/lib/useFocusTrap";

export type EditBookmarkFormData = {
  title: string;
  description: string;
  tags: string[];
  resourceType: ResourceType;
  collectionId: string;
};

type EditBookmarkModalProps = {
  bookmark: Bookmark;
  collections: Collection[];
  isOpen: boolean;
  isSaving?: boolean;
  onClose: () => void;
  onSave: (data: EditBookmarkFormData) => Promise<void>;
};

export function EditBookmarkModal({
  bookmark,
  collections,
  isOpen,
  isSaving = false,
  onClose,
  onSave,
}: EditBookmarkModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [resourceType, setResourceType] = useState<ResourceType>("other");
  const [collectionId, setCollectionId] = useState<string>("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Trap focus inside the modal while it is open.
  useFocusTrap(panelRef, isOpen);

  // Auto-focus the title field when the modal opens.
  useEffect(() => {
    if (isOpen) titleInputRef.current?.focus();
  }, [isOpen]);

  // Populate form whenever the modal opens or the target bookmark changes.
  useEffect(() => {
    if (!isOpen) return;
    setTitle(bookmark.title);
    setDescription(bookmark.description ?? "");
    setTags(bookmark.tags.slice());
    setResourceType(bookmark.resourceType ?? "other");
    setCollectionId(bookmark.collectionId);
    setTagInput("");
    setValidationError(null);
  }, [isOpen, bookmark]);

  // Close on Escape.
  useEffect(() => {
    if (!isOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag));
  }

  function commitTagInput() {
    const normalized = tagInput.trim().toLowerCase().replace(/\s+/g, "-");
    if (!normalized) return;
    setTags((prev) => (prev.includes(normalized) ? prev : [...prev, normalized]));
    setTagInput("");
  }

  async function handleSave() {
    const normalizedTitle = title.trim();
    if (!normalizedTitle) {
      setValidationError("Title is required.");
      return;
    }
    if (!collectionId) {
      setValidationError("Select a collection.");
      return;
    }
    setValidationError(null);
    try {
      await onSave({
        title: normalizedTitle,
        description: description.trim(),
        tags,
        resourceType,
        collectionId,
      });
    } catch (error) {
      setValidationError(
        typeof error === "object" && error !== null && "message" in error
          ? String((error as { message: unknown }).message)
          : "Bookmark could not be updated.",
      );
    }
  }

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Edit bookmark"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div ref={panelRef} className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col rounded-[2rem] border border-white/10 bg-ink-900 shadow-panel">
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-4 rounded-t-[2rem] border-b border-white/10 bg-ink-900/95 p-6 backdrop-blur">
          <div className="flex min-w-0 items-center gap-3">
            {bookmark.faviconUrl ? (
              <img
                src={bookmark.faviconUrl}
                alt=""
                width={24}
                height={24}
                className="h-6 w-6 shrink-0 rounded-md object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            ) : null}
            <div className="min-w-0">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300">
                Edit bookmark
              </p>
              {bookmark.domain ? (
                <p className="mt-0.5 truncate text-sm text-sand-200/70">{bookmark.domain}</p>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="shrink-0 rounded-full border border-white/10 bg-white/5 p-2 text-sand-200/70 transition hover:bg-white/10 hover:text-white disabled:opacity-60"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="space-y-5 p-6">
            {/* URL (read-only) */}
            <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
              <p className="text-sm font-medium text-sand-100">URL</p>
              <a
                href={bookmark.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 block truncate text-sm text-cyan-300 underline-offset-2 hover:underline"
              >
                {bookmark.url}
              </a>
            </div>

            {/* Title */}
            <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
              <label className="text-sm font-medium text-sand-100" htmlFor="edit-bm-title">
                Title
              </label>
              <input
                ref={titleInputRef}
                id="edit-bm-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Page title"
                className="mt-3 min-h-11 w-full rounded-2xl border border-white/10 bg-ink-900/70 px-4 text-sand-100 placeholder:text-sand-300/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900"
              />
            </div>

            {/* Description */}
            <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
              <label className="text-sm font-medium text-sand-100" htmlFor="edit-bm-description">
                Description
              </label>
              <textarea
                id="edit-bm-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="What this link is about"
                className="mt-3 w-full rounded-2xl border border-white/10 bg-ink-900/70 px-4 py-3 text-sand-100 placeholder:text-sand-300/40"
              />
            </div>

            {/* Tags */}
            <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
              <p className="text-sm font-medium text-sand-100">Tags</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {tags.length > 0
                  ? tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-200"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          aria-label={`Remove tag ${tag}`}
                          className="text-cyan-300/60 transition hover:text-cyan-200"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))
                  : null}
                {tags.length === 0 ? (
                  <span className="text-sm text-sand-200/50">No tags yet.</span>
                ) : null}
              </div>
              <div className="mt-3 flex gap-2">
                <div className="relative flex-1">
                  <Tag className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-300/60" />
                  <input
                    ref={tagInputRef}
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        commitTagInput();
                      }
                    }}
                    placeholder="Add a tag and press Enter"
                    className="min-h-9 w-full rounded-2xl border border-white/10 bg-ink-900/70 pl-9 pr-4 text-sm text-sand-100 placeholder:text-sand-300/40"
                  />
                </div>
                <button
                  type="button"
                  onClick={commitTagInput}
                  className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-sand-100 transition hover:bg-white/10"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add
                </button>
              </div>
            </div>

            {/* Resource type + Collection */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <label
                  className="text-sm font-medium text-sand-100"
                  htmlFor="edit-bm-resource-type"
                >
                  Resource type
                </label>
                <div className="relative mt-3">
                  <select
                    id="edit-bm-resource-type"
                    value={resourceType}
                    onChange={(e) => setResourceType(e.target.value as ResourceType)}
                    className="min-h-11 w-full appearance-none rounded-2xl border border-white/10 bg-ink-900/70 py-2 pl-4 pr-10 text-sand-100"
                  >
                    {RESOURCE_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sand-200/60" />
                </div>
              </div>

              <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <label className="text-sm font-medium text-sand-100" htmlFor="edit-bm-collection">
                  Collection
                </label>
                <div className="relative mt-3">
                  <select
                    id="edit-bm-collection"
                    value={collectionId}
                    onChange={(e) => setCollectionId(e.target.value)}
                    className="min-h-11 w-full appearance-none rounded-2xl border border-white/10 bg-ink-900/70 py-2 pl-4 pr-10 text-sand-100"
                  >
                    {collections.length === 0 ? (
                      <option value="">No collections available</option>
                    ) : (
                      collections.map((col) => (
                        <option key={col.id} value={col.id}>
                          {col.name}
                        </option>
                      ))
                    )}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sand-200/60" />
                </div>
              </div>
            </div>

            {validationError ? (
              <p className="text-sm text-rose-200">{validationError}</p>
            ) : null}
          </div>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-end gap-3 rounded-b-[2rem] border-t border-white/10 bg-ink-900/95 px-6 py-4 backdrop-blur">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={isSaving || collections.length === 0}
            className="inline-flex items-center gap-2 rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-ink-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900"
          >
            <Edit3 className="h-4 w-4" />
            {isSaving ? "Updating..." : "Update bookmark"}
          </button>
        </div>
      </div>
    </div>
  );
}
