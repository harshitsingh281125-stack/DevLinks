import { useId, useRef, useState } from "react";
import { ExternalLink } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import type { Bookmark, Collection } from "@/lib/types";
import { BookmarkFields } from "./BookmarkFields";
import { validateBookmarkDraft, type BookmarkDraft, type BookmarkDraftErrors } from "./bookmarkDraft";

export type EditBookmarkFormData = BookmarkDraft;

type EditBookmarkModalProps = {
  bookmark: Bookmark;
  collections: Collection[];
  isOpen: boolean;
  isSaving?: boolean;
  onClose: () => void;
  onSave: (data: EditBookmarkFormData) => Promise<void>;
};

export function EditBookmarkModal({ isOpen, ...props }: EditBookmarkModalProps) {
  return isOpen ? <EditBookmarkDialog key={props.bookmark.id} {...props} /> : null;
}

function EditBookmarkDialog({
  bookmark,
  collections,
  isSaving = false,
  onClose,
  onSave,
}: Omit<EditBookmarkModalProps, "isOpen">) {
  const formId = useId();
  const titleRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<BookmarkDraft>(() => ({
    title: bookmark.title,
    description: bookmark.description ?? "",
    tags: bookmark.tags.slice(),
    resourceType: bookmark.resourceType ?? "other",
    collectionId: bookmark.collectionId,
  }));
  const [errors, setErrors] = useState<BookmarkDraftErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSave() {
    const nextErrors = validateBookmarkDraft(draft);
    setErrors(nextErrors);
    if (nextErrors.title) {
      titleRef.current?.focus();
      return;
    }
    if (nextErrors.collectionId) return;

    setFormError(null);
    try {
      await onSave({ ...draft, title: draft.title.trim(), description: draft.description.trim() });
    } catch (error) {
      setFormError(
        typeof error === "object" && error !== null && "message" in error
          ? String((error as { message: unknown }).message)
          : "Your changes couldn’t be saved. Try again in a moment.",
      );
    }
  }

  return (
    <Dialog
      title="Edit bookmark"
      description={<span translate="no">{bookmark.domain ?? bookmark.url}</span>}
      onClose={onClose}
      locked={isSaving}
      initialFocusRef={titleRef}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={isSaving}>
            Cancel
          </button>
          <button type="submit" form={formId} className="btn btn-primary" disabled={isSaving}>
            {isSaving ? "Saving…" : "Save changes"}
          </button>
        </>
      }
    >
      <form
        id={formId}
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          void handleSave();
        }}
      >
        <div className="field">
          <span className="label">Link</span>
          <div className="url-row">
            <code translate="no" title={bookmark.url}>
              {bookmark.url}
            </code>
            <a
              href={bookmark.url}
              target="_blank"
              rel="noopener noreferrer"
              className="icon-btn icon-btn-sm"
              aria-label="Open link in a new tab"
            >
              <ExternalLink size={14} strokeWidth={1.75} />
            </a>
          </div>
        </div>

        <BookmarkFields
          idPrefix="edit-bm"
          collections={collections}
          draft={draft}
          errors={errors}
          onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))}
          titleRef={titleRef}
        />
        {formError ? (
          <p className="field-error" role="alert" style={{ marginTop: 14 }}>
            {formError}
          </p>
        ) : null}
      </form>
    </Dialog>
  );
}
