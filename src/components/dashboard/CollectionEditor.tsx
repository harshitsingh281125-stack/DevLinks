import { useEffect, useRef, useState } from "react";
import { Check, Copy, Globe, Lock, Trash2 } from "lucide-react";
import { getOrGenerateSlug } from "@/features/collections/slugUtils";
import { DeleteCollectionDialog } from "./DeleteCollectionDialog";
import type { Collection } from "@/lib/types";

type CollectionEditorProps = {
  activeCollection: Collection | null;
  busyState: "idle" | "creating" | "updating" | "deleting" | "toggling";
  collections: Collection[];
  errorMessage: string | null;
  mode: "create" | "edit";
  onClose: () => void;
  onCreate: (input: { description: string; name: string }) => Promise<void>;
  onDelete: (collectionId: string) => Promise<void>;
  onTogglePublic: (input: { id: string; isPublic: boolean; slug: string | null }) => Promise<void>;
  onUpdate: (input: { description: string; id: string; name: string }) => Promise<void>;
};

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
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(false);
  const [optimisticPublic, setOptimisticPublic] = useState<boolean | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Populate form when mode or active collection changes
  useEffect(() => {
    if (mode === "create") {
      setName("");
      setDescription("");
    } else {
      setName(activeCollection?.name ?? "");
      setDescription(activeCollection?.description ?? "");
    }
    setValidationMessage(null);
    setDuplicateWarning(null);
    setOptimisticPublic(null);
    setTimeout(() => nameInputRef.current?.focus(), 60);
  }, [mode, activeCollection]);

  const isCreating = busyState === "creating";
  const isUpdating = busyState === "updating";
  const isDeleting = busyState === "deleting";
  const isToggling = busyState === "toggling";
  const isBusy = isCreating || isUpdating || isDeleting || isToggling;
  const hasEditableCollection = Boolean(activeCollection);

  const previewSlug = activeCollection ? getOrGenerateSlug(activeCollection) : null;
  const publicUrl = previewSlug
    ? `${window.location.origin}/public/collections/${previewSlug}`
    : null;

  async function handleCopyUrl() {
    if (!publicUrl) return;
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleTogglePublic() {
    if (!activeCollection) return;
    const nextIsPublic = !(optimisticPublic ?? activeCollection.isPublic);
    setOptimisticPublic(nextIsPublic);
    const slug = nextIsPublic ? getOrGenerateSlug(activeCollection) : null;
    try {
      await onTogglePublic({ id: activeCollection.id, isPublic: nextIsPublic, slug });
    } catch {
      setOptimisticPublic(null);
    }
  }

  function checkDuplicate(val: string) {
    const lower = val.trim().toLowerCase();
    const clash = collections.find(
      (c) => c.name.trim().toLowerCase() === lower && c.id !== activeCollection?.id,
    );
    setDuplicateWarning(clash ? `You already have a collection named "${clash.name}".` : null);
  }

  const handleSubmit = async () => {
    const normalizedName = name.trim();

    if (!normalizedName) {
      setValidationMessage("Collection name is required.");
      return;
    }

    setValidationMessage(null);

    if (mode === "create") {
      await onCreate({ name: normalizedName, description: description.trim() });
      onClose();
      return;
    }

    if (!activeCollection) {
      setValidationMessage("No collection selected.");
      return;
    }

    await onUpdate({
      id: activeCollection.id,
      name: normalizedName,
      description: description.trim(),
    });
    onClose();
  };

  return (
    <div className="dl-sheet-body">
      <div className="space-y-4">
        <div className="dl-sheet-field">
          <label className="dl-sheet-label" htmlFor="collection-name">
            Collection name
          </label>
          <input
            ref={nameInputRef}
            id="collection-name"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              checkDuplicate(e.target.value);
            }}
            onKeyDown={(e) => { if (e.key === "Enter") void handleSubmit(); }}
            placeholder="React Debugging"
            className="dl-sheet-input"
          />
          {duplicateWarning ? (
            <p className="dl-sheet-warn">{duplicateWarning}</p>
          ) : null}
        </div>

        <div className="dl-sheet-field">
          <label className="dl-sheet-label" htmlFor="collection-description">
            Description
          </label>
          <textarea
            id="collection-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="What belongs in this collection and why."
            className="dl-sheet-textarea"
          />
        </div>
      </div>

      {validationMessage ? (
        <p className="dl-sheet-error">{validationMessage}</p>
      ) : null}
      {errorMessage ? (
        <p className="dl-sheet-error">{errorMessage}</p>
      ) : null}

      <div className="dl-sheet-actions">
        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={isBusy}
          className="dl-sheet-btn primary"
        >
          {mode === "create"
            ? isCreating ? "Creating…" : "Create collection"
            : isUpdating ? "Saving…" : "Save changes"}
        </button>

        <button
          type="button"
          onClick={onClose}
          disabled={isBusy}
          className="dl-sheet-btn ghost"
        >
          Cancel
        </button>

        {mode === "edit" ? (
          <button
            type="button"
            onClick={() => setPendingDelete(true)}
            disabled={!hasEditableCollection || isBusy}
            className="dl-sheet-btn danger"
            style={{ marginLeft: "auto" }}
          >
            <Trash2 size={13} />
            {isDeleting ? "Deleting…" : "Delete"}
          </button>
        ) : null}
      </div>

      {/* Sharing — edit mode only */}
      {mode === "edit" && activeCollection ? (
        <div className="dl-sheet-section">
          <p className="dl-sheet-section-label">Sharing</p>

          {(() => {
            const isPublic = optimisticPublic ?? activeCollection.isPublic;
            return (
              <>
                <div className="dl-sheet-sharing-row">
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {isPublic ? (
                      <Globe size={14} style={{ color: "var(--accent)", flexShrink: 0 }} />
                    ) : (
                      <Lock size={14} style={{ color: "var(--fg-3)", flexShrink: 0 }} />
                    )}
                    <span style={{ fontSize: 13, color: "var(--fg-1)" }}>
                      {isPublic
                        ? "Public — visible to anyone with the link"
                        : "Private — only you can see this"}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => void handleTogglePublic()}
                    disabled={isBusy}
                    aria-pressed={isPublic}
                    aria-label={isPublic ? "Make collection private" : "Make collection public"}
                    className={`dl-toggle${isPublic ? " on" : ""}`}
                  >
                    <span className="dl-toggle-knob" />
                  </button>
                </div>

                {(isPublic || activeCollection.slug) && previewSlug && publicUrl ? (
                  <div className="dl-sheet-url-row">
                    <p className="dl-sheet-url-label">Public link</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <code className="dl-sheet-url-code">{publicUrl}</code>
                      <button
                        type="button"
                        onClick={() => void handleCopyUrl()}
                        aria-label="Copy public URL"
                        className="dl-sheet-copy-btn"
                      >
                        {copied ? <Check size={13} style={{ color: "var(--accent)" }} /> : <Copy size={13} />}
                      </button>
                    </div>
                  </div>
                ) : !isPublic ? (
                  <p className="dl-sheet-hint">Toggle public to generate a shareable link.</p>
                ) : null}

                {isToggling ? (
                  <p className="dl-sheet-hint">Updating visibility…</p>
                ) : null}
              </>
            );
          })()}
        </div>
      ) : null}

      {pendingDelete && activeCollection ? (
        <DeleteCollectionDialog
          collection={activeCollection}
          onCancel={() => setPendingDelete(false)}
          onConfirm={() => {
            setPendingDelete(false);
            void onDelete(activeCollection.id);
            onClose();
          }}
        />
      ) : null}
    </div>
  );
}
