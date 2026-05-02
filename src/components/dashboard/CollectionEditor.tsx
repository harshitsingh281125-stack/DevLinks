import { useEffect, useState } from "react";
import { Check, Copy, Globe, Lock, PencilLine, Plus, Trash2 } from "lucide-react";
import { getOrGenerateSlug } from "@/features/collections/slugUtils";
import type { Collection } from "@/lib/types";

type CollectionEditorProps = {
  activeCollection: Collection | null;
  busyState: "idle" | "creating" | "updating" | "deleting" | "toggling";
  errorMessage: string | null;
  mode: "create" | "edit";
  onCreate: (input: { description: string; name: string }) => Promise<void>;
  onDelete: (collectionId: string) => Promise<void>;
  onModeChange: (mode: "create" | "edit") => void;
  onTogglePublic: (input: { id: string; isPublic: boolean; slug: string | null }) => Promise<void>;
  onUpdate: (input: { description: string; id: string; name: string }) => Promise<void>;
};

export function CollectionEditor({
  activeCollection,
  busyState,
  errorMessage,
  mode,
  onCreate,
  onDelete,
  onModeChange,
  onTogglePublic,
  onUpdate,
}: CollectionEditorProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (mode === "create") {
      setName("");
      setDescription("");
      setValidationMessage(null);
      return;
    }

    setName(activeCollection?.name ?? "");
    setDescription(activeCollection?.description ?? "");
    setValidationMessage(null);
  }, [activeCollection, mode]);

  const isCreating = busyState === "creating";
  const isUpdating = busyState === "updating";
  const isDeleting = busyState === "deleting";
  const isToggling = busyState === "toggling";
  const isBusy = isCreating || isUpdating || isDeleting || isToggling;
  const hasEditableCollection = Boolean(activeCollection);

  // Slug and public URL — computed from the active collection when in edit mode.
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
    const nextIsPublic = !activeCollection.isPublic;
    // Only pass the slug when making public for the first time; on private
    // toggle we send null so the DB slug column is left intact.
    const slug = nextIsPublic ? getOrGenerateSlug(activeCollection) : null;
    await onTogglePublic({ id: activeCollection.id, isPublic: nextIsPublic, slug });
  }

  const handleSubmit = async () => {
    const normalizedName = name.trim();

    if (!normalizedName) {
      setValidationMessage("Collection name is required.");
      return;
    }

    setValidationMessage(null);

    if (mode === "create") {
      await onCreate({
        name: normalizedName,
        description: description.trim(),
      });
      return;
    }

    if (!activeCollection) {
      setValidationMessage("Select a collection to edit.");
      return;
    }

    await onUpdate({
      id: activeCollection.id,
      name: normalizedName,
      description: description.trim(),
    });
  };

  return (
    <article className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-panel backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300">
            Collection editor
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            {mode === "create" ? "Create a collection" : "Edit selected collection"}
          </h2>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              onModeChange("create");
            }}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950 ${
              mode === "create"
                ? "bg-cyan-400 text-ink-950"
                : "border border-white/10 bg-white/5 text-white hover:bg-white/10"
            }`}
          >
            <Plus className="h-4 w-4" />
            New
          </button>
          <button
            type="button"
            onClick={() => {
              onModeChange("edit");
            }}
            disabled={!hasEditableCollection}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950 ${
              mode === "edit"
                ? "bg-white text-ink-950"
                : "border border-white/10 bg-white/5 text-white hover:bg-white/10"
            } disabled:cursor-not-allowed disabled:opacity-50`}
          >
            <PencilLine className="h-4 w-4" />
            Edit
          </button>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
          <label className="text-sm font-medium text-sand-100" htmlFor="collection-name">
            Collection name
          </label>
          <input
            id="collection-name"
            type="text"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
            }}
            placeholder="React Debugging"
            className="mt-3 min-h-12 w-full rounded-2xl border border-white/10 bg-ink-900/70 px-4 text-sand-100 placeholder:text-sand-300/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950"
          />
        </div>

        <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
          <label
            className="text-sm font-medium text-sand-100"
            htmlFor="collection-description"
          >
            Description
          </label>
          <textarea
            id="collection-description"
            value={description}
            onChange={(event) => {
              setDescription(event.target.value);
            }}
            rows={4}
            placeholder="Why this collection exists and what belongs inside it."
            className="mt-3 w-full rounded-2xl border border-white/10 bg-ink-900/70 px-4 py-3 text-sand-100 placeholder:text-sand-300/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950"
          />
        </div>
      </div>

      {validationMessage ? (
        <p className="mt-4 text-sm text-rose-200">{validationMessage}</p>
      ) : null}
      {errorMessage ? <p className="mt-4 text-sm text-rose-200">{errorMessage}</p> : null}

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => {
            void handleSubmit();
          }}
          disabled={isBusy}
          className="inline-flex items-center gap-2 rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-ink-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950"
        >
          {mode === "create"
            ? isCreating
              ? "Creating..."
              : "Create collection"
            : isUpdating
              ? "Saving..."
              : "Save changes"}
        </button>

        {mode === "edit" ? (
          <button
            type="button"
            onClick={() => {
              if (activeCollection) {
                void onDelete(activeCollection.id);
              }
            }}
            disabled={!hasEditableCollection || isBusy}
            className="inline-flex items-center gap-2 rounded-full border border-rose-400/25 bg-rose-400/10 px-5 py-3 text-sm font-semibold text-rose-100 transition hover:bg-rose-400/20 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950"
          >
            <Trash2 className="h-4 w-4" />
            {isDeleting ? "Deleting..." : "Delete collection"}
          </button>
        ) : null}
      </div>

      {/* ── Sharing section — only visible in edit mode with an active collection ─ */}
      {mode === "edit" && activeCollection ? (
        <div className="mt-6 rounded-2xl border border-white/8 bg-white/5 p-4">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sand-100/70">
            Sharing
          </p>

          <div className="mt-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              {activeCollection.isPublic ? (
                <Globe className="h-4 w-4 shrink-0 text-emerald-300" />
              ) : (
                <Lock className="h-4 w-4 shrink-0 text-sand-300/60" />
              )}
              <span className="text-sm text-sand-100">
                {activeCollection.isPublic ? "Public — visible to anyone with the link" : "Private — only you can see this"}
              </span>
            </div>

            {/* Toggle button */}
            <button
              type="button"
              onClick={() => void handleTogglePublic()}
              disabled={isBusy}
              aria-pressed={activeCollection.isPublic}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 disabled:cursor-not-allowed disabled:opacity-50 ${
                activeCollection.isPublic
                  ? "border-emerald-400/40 bg-emerald-400/20"
                  : "border-white/20 bg-white/10"
              }`}
              aria-label={activeCollection.isPublic ? "Make collection private" : "Make collection public"}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full transition ${
                  activeCollection.isPublic
                    ? "translate-x-5 bg-emerald-300"
                    : "translate-x-0.5 bg-sand-300/60"
                }`}
              />
            </button>
          </div>

          {/* Slug preview + URL + copy — shown once the collection is public or has a slug */}
          {(activeCollection.isPublic || activeCollection.slug) && previewSlug && publicUrl ? (
            <div className="mt-4 rounded-xl border border-white/10 bg-ink-900/50 px-4 py-3">
              <p className="text-xs font-medium text-sand-300/60">Public link</p>
              <div className="mt-1.5 flex items-center gap-2">
                <code className="flex-1 truncate text-xs text-cyan-200">{publicUrl}</code>
                <button
                  type="button"
                  onClick={() => void handleCopyUrl()}
                  aria-label="Copy public URL"
                  className="shrink-0 rounded-full border border-white/10 bg-white/5 p-1.5 text-sand-300/60 transition hover:bg-white/10 hover:text-white"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-emerald-300" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
              <p className="mt-2 text-xs text-sand-300/50">
                Slug: <span className="font-mono text-sand-200/70">{previewSlug}</span>
                {!activeCollection.slug
                  ? " — will be set when you make this collection public"
                  : null}
              </p>
            </div>
          ) : !activeCollection.isPublic ? (
            <p className="mt-3 text-xs text-sand-300/50">
              Toggle public to generate a shareable link. The slug is fixed after first publication.
            </p>
          ) : null}

          {isToggling ? (
            <p className="mt-3 text-xs text-sand-300/60">Updating visibility…</p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-4 rounded-2xl border border-white/8 bg-white/5 p-4 text-sm text-sand-200/75">
        {mode === "create" ? (
          <p>
            New collections appear in the sidebar immediately after creation so they can
            become the active workspace context.
          </p>
        ) : (
          <p>
            Deleting a collection will fail if bookmarks still belong to it. That
            database constraint is enforced to prevent orphaned bookmark rows.
          </p>
        )}
      </div>
    </article>
  );
}
