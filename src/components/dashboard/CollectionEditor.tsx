import { useEffect, useId, useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import { getOrGenerateSlug } from "@/features/collections/slugUtils";
import type { Collection } from "@/lib/types";
import { DeleteCollectionDialog } from "./DeleteCollectionDialog";

export type CollectionEditorProps = {
  activeCollection: Collection | null;
  busyState: "idle" | "creating" | "updating" | "deleting" | "toggling";
  collections: Collection[];
  errorMessage: string | null;
  mode: "create" | "edit";
  onClose: () => void;
  onCreate: (input: { description: string; name: string; isRoadmap: boolean }) => Promise<void>;
  onDelete: (collectionId: string) => Promise<void>;
  onTogglePublic: (input: { id: string; isPublic: boolean; slug: string | null }) => Promise<void>;
  onUpdate: (input: { description: string; id: string; name: string; isRoadmap: boolean }) => Promise<void>;
};

function messageOf(error: unknown, fallback: string) {
  return typeof error === "object" && error !== null && "message" in error
    ? String((error as { message: unknown }).message)
    : fallback;
}

export function CollectionEditor({
  activeCollection,
  busyState,
  collections,
  errorMessage,
  mode,
  onClose,
  onCreate,
  onDelete,
  onTogglePublic,
  onUpdate,
}: CollectionEditorProps) {
  const nameId = useId();
  const descriptionId = useId();
  const sharingId = useId();
  const roadmapId = useId();
  const editing = mode === "edit" ? activeCollection : null;

  const [name, setName] = useState(editing?.name ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [isRoadmap, setIsRoadmap] = useState(editing?.isRoadmap ?? false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(false);
  const [optimisticPublic, setOptimisticPublic] = useState<boolean | null>(null);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(t);
  }, [copied]);

  const isCreating = busyState === "creating";
  const isUpdating = busyState === "updating";
  const isDeleting = busyState === "deleting";
  const isToggling = busyState === "toggling";
  const isBusy = busyState !== "idle";

  const trimmedName = name.trim().toLowerCase();
  const nameClash = trimmedName
    ? collections.find((c) => c.name.trim().toLowerCase() === trimmedName && c.id !== editing?.id)
    : undefined;

  const isPublic = optimisticPublic ?? editing?.isPublic ?? false;
  const slug = editing ? getOrGenerateSlug(editing) : null;
  const publicUrl = slug ? `${window.location.origin}/public/collections/${slug}` : null;

  async function handleSubmit() {
    const normalizedName = name.trim();
    if (!normalizedName) {
      setNameError("Give the collection a name.");
      return;
    }
    setNameError(null);
    setSubmitError(null);

    try {
      if (mode === "create") {
        await onCreate({ name: normalizedName, description: description.trim(), isRoadmap });
      } else if (editing) {
        await onUpdate({ id: editing.id, name: normalizedName, description: description.trim(), isRoadmap });
      }
      onClose();
    } catch (error) {
      setSubmitError(messageOf(error, "The collection couldn’t be saved. Try again in a moment."));
    }
  }

  async function handleTogglePublic() {
    if (!editing) return;
    const next = !isPublic;
    setOptimisticPublic(next);
    try {
      await onTogglePublic({ id: editing.id, isPublic: next, slug: next ? getOrGenerateSlug(editing) : null });
    } catch {
      setOptimisticPublic(null);
    }
  }

  async function handleCopyUrl() {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
    } catch {
      // Clipboard blocked; the URL stays selectable in the field.
    }
  }

  const shownError = submitError ?? errorMessage;

  return (
    <>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          void handleSubmit();
        }}
      >
        <div className="field">
          <label className="label" htmlFor={nameId}>
            Collection name
          </label>
          <input
            id={nameId}
            className="input"
            type="text"
            name="name"
            autoComplete="off"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (nameError) setNameError(null);
            }}
            placeholder="React debugging…"
            maxLength={80}
            aria-invalid={nameError ? true : undefined}
            aria-describedby={nameError || nameClash ? `${nameId}-msg` : undefined}
          />
          {nameError ? (
            <p id={`${nameId}-msg`} className="field-error">
              {nameError}
            </p>
          ) : nameClash ? (
            <p id={`${nameId}-msg`} className="field-warn">
              You already have a collection called “{nameClash.name}”.
            </p>
          ) : null}
        </div>

        <div className="field">
          <label className="label" htmlFor={descriptionId}>
            Description <span className="label-optional">Optional</span>
          </label>
          <textarea
            id={descriptionId}
            className="textarea"
            name="description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What belongs here, and why…"
          />
          <p className="hint">Shown at the top of the collection, and on its public page if you share it.</p>
        </div>

        <div className="setting-row" style={{ marginTop: 20 }}>
          <div>
            <p id={roadmapId} className="setting-title">
              Roadmap
            </p>
            <p className="setting-text">
              Number the links and set the order readers should follow, like a study plan.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            className="switch"
            aria-checked={isRoadmap}
            aria-labelledby={roadmapId}
            onClick={() => setIsRoadmap((v) => !v)}
          />
        </div>

        {shownError ? (
          <p className="field-error" role="alert" style={{ marginTop: 14 }}>
            {shownError}
          </p>
        ) : null}

        <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
          <button type="submit" className="btn btn-primary" disabled={isBusy}>
            {mode === "create"
              ? isCreating
                ? "Creating…"
                : "Create collection"
              : isUpdating
                ? "Saving…"
                : "Save changes"}
          </button>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={isCreating || isUpdating}>
            Cancel
          </button>
        </div>
      </form>

      {editing ? (
        <>
          <hr className="divider" />

          <section aria-labelledby={sharingId}>
            <div className="setting-row">
              <div>
                <h3 id={sharingId} className="setting-title">
                  Public page
                </h3>
                <p className="setting-text">
                  {isPublic
                    ? "Anyone with the link can read this collection. They can’t edit it."
                    : "Only you can see this collection."}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                className="switch"
                aria-checked={isPublic}
                aria-labelledby={sharingId}
                onClick={() => void handleTogglePublic()}
                disabled={isBusy}
              />
            </div>

            {isPublic && publicUrl ? (
              <div className="url-row" style={{ marginTop: 12 }}>
                <code translate="no" title={publicUrl}>
                  {publicUrl.replace(/^https?:\/\//, "")}
                </code>
                <button
                  type="button"
                  className="icon-btn icon-btn-sm"
                  onClick={() => void handleCopyUrl()}
                  aria-label={copied ? "Public link copied" : "Copy public link"}
                >
                  {copied ? <Check size={14} strokeWidth={2} /> : <Copy size={14} strokeWidth={1.75} />}
                </button>
                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="icon-btn icon-btn-sm"
                  aria-label="Open public page in a new tab"
                >
                  <ExternalLink size={14} strokeWidth={1.75} />
                </a>
              </div>
            ) : null}
            <p className="hint" role="status" style={{ marginTop: 8, minHeight: "1.5em" }}>
              {isToggling ? "Updating visibility…" : copied ? "Link copied to clipboard." : ""}
            </p>
          </section>

          <hr className="divider" style={{ marginTop: 10 }} />

          <div className="danger-zone">
            <div>
              <p className="setting-title">Delete collection</p>
              <p className="setting-text">It has to be empty first.</p>
            </div>
            <button
              type="button"
              className="btn btn-danger-ghost btn-sm"
              onClick={() => setPendingDelete(true)}
              disabled={isBusy}
            >
              {isDeleting ? "Deleting…" : "Delete…"}
            </button>
          </div>
        </>
      ) : null}

      {pendingDelete && editing ? (
        <DeleteCollectionDialog
          collection={editing}
          onCancel={() => setPendingDelete(false)}
          onConfirm={async () => {
            setPendingDelete(false);
            setSubmitError(null);
            try {
              await onDelete(editing.id);
              onClose();
            } catch (error) {
              // Stay open so the reason (usually "still has bookmarks") is visible.
              setSubmitError(messageOf(error, "The collection couldn’t be deleted."));
            }
          }}
        />
      ) : null}
    </>
  );
}
