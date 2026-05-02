import { useEffect, useRef } from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";
import type { Bookmark } from "@/lib/types";
import { useFocusTrap } from "@/lib/useFocusTrap";

type DeleteBookmarkDialogProps = {
  bookmark: Bookmark;
  onCancel: () => void;
  onConfirm: () => void;
};

export function DeleteBookmarkDialog({
  bookmark,
  onCancel,
  onConfirm,
}: DeleteBookmarkDialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  // Trap focus inside the dialog.
  useFocusTrap(panelRef, true);

  // Move initial focus to Cancel (safe default for destructive dialogs).
  useEffect(() => {
    cancelButtonRef.current?.focus();
  }, []);

  // Close on Escape.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onCancel]);

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-label="Delete bookmark"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Panel */}
      <div ref={panelRef} className="relative z-10 w-full max-w-md rounded-[2rem] border border-white/10 bg-ink-900 shadow-panel">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 rounded-t-[2rem] border-b border-white/10 bg-ink-900/95 p-6 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-rose-400/15 text-rose-300">
              <AlertTriangle className="h-4.5 w-4.5" />
            </div>
            <p className="text-base font-semibold text-white">Delete bookmark?</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="shrink-0 rounded-full border border-white/10 bg-white/5 p-2 text-sand-200/70 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900"
            aria-label="Cancel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-sm leading-6 text-sand-200/80">
            <span className="font-semibold text-white">&ldquo;{bookmark.title}&rdquo;</span> will
            be permanently removed from your library. This cannot be undone.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 rounded-b-[2rem] border-t border-white/10 bg-ink-900/95 px-6 py-4 backdrop-blur">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex items-center gap-2 rounded-full bg-rose-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
