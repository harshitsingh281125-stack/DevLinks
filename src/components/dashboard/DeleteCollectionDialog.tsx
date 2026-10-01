import { useRef } from "react";
import { Dialog } from "@/components/ui/Dialog";
import type { Collection } from "@/lib/types";

type DeleteCollectionDialogProps = {
  collection: Collection;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
};

export function DeleteCollectionDialog({ collection, onCancel, onConfirm }: DeleteCollectionDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  return (
    <Dialog
      role="alertdialog"
      size="sm"
      title="Delete this collection?"
      onClose={onCancel}
      initialFocusRef={cancelRef}
      footer={
        <>
          <button ref={cancelRef} type="button" className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="btn btn-danger" onClick={() => void onConfirm()}>
            Delete collection
          </button>
        </>
      }
    >
      <p className="dialog-copy">
        <strong>“{collection.name}”</strong> will be deleted, along with its public link if it has
        one. This can’t be undone.
      </p>
      <p className="dialog-copy">
        Collections that still hold bookmarks can’t be deleted. Move or delete those bookmarks first.
      </p>
    </Dialog>
  );
}
