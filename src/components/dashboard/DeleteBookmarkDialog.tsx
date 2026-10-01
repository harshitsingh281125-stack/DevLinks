import { useRef } from "react";
import { Dialog } from "@/components/ui/Dialog";
import type { Bookmark } from "@/lib/types";

type DeleteBookmarkDialogProps = {
  bookmark: Bookmark;
  onCancel: () => void;
  onConfirm: () => void;
};

export function DeleteBookmarkDialog({ bookmark, onCancel, onConfirm }: DeleteBookmarkDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  return (
    <Dialog
      role="alertdialog"
      size="sm"
      title="Delete this bookmark?"
      onClose={onCancel}
      initialFocusRef={cancelRef}
      footer={
        <>
          <button ref={cancelRef} type="button" className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="btn btn-danger" onClick={onConfirm}>
            Delete bookmark
          </button>
        </>
      }
    >
      <p className="dialog-copy">
        <strong>“{bookmark.title}”</strong> will be removed from your library. This can’t be undone.
      </p>
    </Dialog>
  );
}
