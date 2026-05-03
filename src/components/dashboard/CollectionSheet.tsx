import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { CollectionEditor } from "./CollectionEditor";
import type { Collection } from "@/lib/types";

type CollectionSheetProps = {
  activeCollection: Collection | null;
  busyState: "idle" | "creating" | "updating" | "deleting" | "toggling";
  collections: Collection[];
  errorMessage: string | null;
  isOpen: boolean;
  mode: "create" | "edit";
  onClose: () => void;
  onCreate: (input: { description: string; name: string }) => Promise<void>;
  onDelete: (collectionId: string) => Promise<void>;
  onTogglePublic: (input: { id: string; isPublic: boolean; slug: string | null }) => Promise<void>;
  onUpdate: (input: { description: string; id: string; name: string }) => Promise<void>;
};

export function CollectionSheet({
  activeCollection,
  busyState,
  collections,
  errorMessage,
  isOpen,
  mode,
  onClose,
  onCreate,
  onDelete,
  onTogglePublic,
  onUpdate,
}: CollectionSheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Escape closes the sheet
  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  // Trap scroll behind the sheet
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  const title = mode === "create" ? "New collection" : (activeCollection?.name ?? "Edit collection");

  return (
    <>
      {/* Backdrop */}
      <div
        className="dl-sheet-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className="dl-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {/* Header */}
        <div className="dl-sheet-header">
          <div>
            <p className="dl-sheet-eyebrow">
              {mode === "create" ? "Collections" : "Edit collection"}
            </p>
            <h2 className="dl-sheet-title">{title}</h2>
          </div>
          <button
            type="button"
            className="dl-sheet-close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="dl-sheet-content">
          <CollectionEditor
            activeCollection={activeCollection}
            busyState={busyState}
            collections={collections}
            errorMessage={errorMessage}
            mode={mode}
            onClose={onClose}
            onCreate={onCreate}
            onDelete={onDelete}
            onTogglePublic={onTogglePublic}
            onUpdate={onUpdate}
          />
        </div>
      </div>
    </>
  );
}
