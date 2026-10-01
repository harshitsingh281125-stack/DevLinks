import { useId, useRef, useState } from "react";
import { CopyCheck, Info, X } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { Favicon } from "@/components/ui/Favicon";
import { resourceTypeLabel } from "@/lib/resourceTypes";
import type { Bookmark, Collection, MetadataFetchStatus, MetadataPreview } from "@/lib/types";
import { BookmarkFields } from "./BookmarkFields";
import { validateBookmarkDraft, type BookmarkDraft, type BookmarkDraftErrors } from "./bookmarkDraft";

// ─── Fetch-status notices ─────────────────────────────────────────────────────

const FETCH_STATUS_NOTICES: Partial<Record<MetadataFetchStatus, { heading: string; body: string }>> = {
  partial: {
    heading: "Some details are missing",
    body: "The page only exposed part of its metadata. Check the title and description before saving.",
  },
  blocked: {
    heading: "This site blocks previews",
    body: "The title was left blank so you can write your own.",
  },
  timeout: {
    heading: "The page took too long to respond",
    body: "Details may be incomplete. Edit the title and description before saving.",
  },
  error: {
    heading: "The page couldn’t be reached",
    body: "You can still save the link. Add a title so you can find it later.",
  },
  invalid_url: {
    heading: "This link looks malformed",
    body: "Double-check the address before saving.",
  },
};

export type BookmarkFormData = BookmarkDraft;
export type SaveBookmarkResult = { duplicate?: Bookmark };

type SaveBookmarkModalProps = {
  collections: Collection[];
  defaultCollectionId: string | null;
  isSaving?: boolean;
  isOpen: boolean;
  onClose: () => void;
  onEditExisting?: (bookmark: Bookmark) => void;
  onSave: (data: BookmarkFormData) => Promise<SaveBookmarkResult>;
  preview: MetadataPreview;
};

export function SaveBookmarkModal({ isOpen, ...props }: SaveBookmarkModalProps) {
  // Mount the dialog only while open so its form state starts fresh every time.
  return isOpen ? <SaveBookmarkDialog {...props} /> : null;
}

function SaveBookmarkDialog({
  collections,
  defaultCollectionId,
  isSaving = false,
  onClose,
  onEditExisting,
  onSave,
  preview,
}: Omit<SaveBookmarkModalProps, "isOpen">) {
  const formId = useId();
  const titleRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<BookmarkDraft>(() => ({
    title: preview.title ?? "",
    description: preview.description ?? "",
    tags: preview.suggestedTags.slice(),
    resourceType: preview.resourceType ?? "other",
    collectionId: defaultCollectionId ?? collections[0]?.id ?? "",
  }));
  const [errors, setErrors] = useState<BookmarkDraftErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [duplicate, setDuplicate] = useState<Bookmark | null>(null);
  const [imageFailed, setImageFailed] = useState(false);
  const [statusDismissed, setStatusDismissed] = useState(false);

  const statusNotice = FETCH_STATUS_NOTICES[preview.fetchStatus];
  const typeLabel = resourceTypeLabel(draft.resourceType);
  const duplicateCollection = duplicate
    ? (collections.find((c) => c.id === duplicate.collectionId)?.name ?? "another collection")
    : null;

  async function handleSave() {
    const nextErrors = validateBookmarkDraft(draft);
    setErrors(nextErrors);
    if (nextErrors.title) {
      titleRef.current?.focus();
      return;
    }
    if (nextErrors.collectionId) return;

    setFormError(null);
    setDuplicate(null);
    try {
      const result = await onSave({ ...draft, title: draft.title.trim(), description: draft.description.trim() });
      if (result.duplicate) setDuplicate(result.duplicate);
    } catch (error) {
      setFormError(
        typeof error === "object" && error !== null && "message" in error
          ? String((error as { message: unknown }).message)
          : "The bookmark couldn’t be saved. Try again in a moment.",
      );
    }
  }

  return (
    <Dialog
      title="Save bookmark"
      description={<span translate="no">{preview.domain ?? preview.url}</span>}
      onClose={onClose}
      locked={isSaving}
      initialFocusRef={titleRef}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={isSaving}>
            Cancel
          </button>
          <button
            type="submit"
            form={formId}
            className="btn btn-primary"
            disabled={isSaving || collections.length === 0}
          >
            {isSaving ? "Saving…" : "Save bookmark"}
          </button>
        </>
      }
    >
      <div className="preview-card">
        {preview.imageUrl && !imageFailed ? (
          <img
            className="preview-thumb"
            src={preview.imageUrl}
            alt=""
            width={96}
            height={50}
            onError={() => setImageFailed(true)}
          />
        ) : (
          <Favicon domain={preview.domain} src={preview.faviconUrl} />
        )}
        <div className="preview-text">
          <p className="preview-url" translate="no" title={preview.url}>
            {preview.url}
          </p>
          <div className="preview-meta">
            {typeLabel ? <span className="badge">Detected: {typeLabel}</span> : null}
            <span className="badge" data-status={preview.fetchStatus}>
              {preview.fetchStatus === "success" ? "Preview complete" : "Preview incomplete"}
            </span>
          </div>
        </div>
      </div>

      {statusNotice && !statusDismissed ? (
        <div className="notice notice-warn" style={{ marginBottom: 16 }}>
          <Info size={15} strokeWidth={1.75} />
          <div className="notice-body">
            <p className="notice-title">{statusNotice.heading}</p>
            <p className="notice-text">{statusNotice.body}</p>
          </div>
          <button
            type="button"
            className="icon-btn icon-btn-sm"
            onClick={() => setStatusDismissed(true)}
            aria-label="Dismiss"
          >
            <X size={14} strokeWidth={1.75} />
          </button>
        </div>
      ) : null}

      {duplicate ? (
        <div className="notice notice-warn" role="alert" style={{ marginBottom: 16 }}>
          <CopyCheck size={15} strokeWidth={1.75} />
          <div className="notice-body">
            <p className="notice-title">You already saved this link</p>
            <p className="notice-text">
              “{duplicate.title}” is in {duplicateCollection}. Links are matched without www, query
              strings, or trailing slashes.
            </p>
            {onEditExisting ? (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ marginTop: 10 }}
                onClick={() => onEditExisting(duplicate)}
              >
                Edit the saved one
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      <form
        id={formId}
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          void handleSave();
        }}
      >
        <BookmarkFields
          idPrefix="save-bm"
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
