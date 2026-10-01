import { useEffect, type RefObject } from "react";

/** Closes a popover on outside pointer-down or Escape. */
export function useDismiss(
  containerRef: RefObject<HTMLElement | null>,
  open: boolean,
  onDismiss: () => void,
) {
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) onDismiss();
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onDismiss();
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [containerRef, open, onDismiss]);
}
