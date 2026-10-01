import { useEffect, useId, useRef, type ReactNode, type RefObject } from "react";
import { X } from "lucide-react";
import { useFocusTrap } from "@/lib/useFocusTrap";
import { cn } from "@/lib/utils";

// One overlay primitive for every modal surface in the app. Handles focus trap,
// initial focus, focus restore, Escape (innermost dialog wins), and scroll lock.

let scrollLocks = 0;

function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    scrollLocks += 1;
    document.body.style.overflow = "hidden";
    return () => {
      scrollLocks -= 1;
      if (scrollLocks === 0) document.body.style.overflow = "";
    };
  }, [active]);
}

type OverlayProps = {
  children: ReactNode;
  description?: ReactNode;
  /** Footer row; rendered in a tinted strip under the body. */
  footer?: ReactNode;
  icon?: ReactNode;
  initialFocusRef?: RefObject<HTMLElement>;
  /** Blocks Escape, scrim click, and the close button (e.g. while saving). */
  locked?: boolean;
  onClose: () => void;
  role?: "dialog" | "alertdialog";
  title: ReactNode;
};

function useOverlayBehaviour(
  panelRef: RefObject<HTMLDivElement | null>,
  initialFocusRef: RefObject<HTMLElement> | undefined,
) {
  useFocusTrap(panelRef, true);
  useScrollLock(true);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const target =
      initialFocusRef?.current ??
      panelRef.current?.querySelector<HTMLElement>(
        "input:not([disabled]), textarea:not([disabled]), select:not([disabled]), button:not([disabled])",
      );
    target?.focus();
    return () => {
      // Only restore focus if it is still inside the closing overlay (or lost).
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

function Header({
  description,
  icon,
  locked,
  onClose,
  title,
  titleId,
  descriptionId,
}: Pick<OverlayProps, "description" | "icon" | "locked" | "onClose" | "title"> & {
  titleId: string;
  descriptionId: string;
}) {
  return (
    <div className="dialog-head">
      {icon}
      <div className="dialog-head-text">
        <h2 id={titleId} className="dialog-title">
          {title}
        </h2>
        {description ? (
          <p id={descriptionId} className="dialog-sub">
            {description}
          </p>
        ) : null}
      </div>
      <button
        type="button"
        className="icon-btn"
        onClick={onClose}
        disabled={locked}
        aria-label="Close"
        style={{ marginTop: -4, marginRight: -6 }}
      >
        <X size={16} strokeWidth={1.75} />
      </button>
    </div>
  );
}

export function Dialog({
  children,
  description,
  footer,
  icon,
  initialFocusRef,
  locked = false,
  onClose,
  role = "dialog",
  size = "md",
  title,
}: OverlayProps & { size?: "sm" | "md" }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  useOverlayBehaviour(panelRef, initialFocusRef);

  return (
    <div
      className="overlay"
      onKeyDown={(e) => {
        if (e.key !== "Escape") return;
        e.stopPropagation();
        if (!locked) onClose();
      }}
    >
      <div className="overlay-scrim anim-overlay" onClick={locked ? undefined : onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role={role}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className={cn("dialog anim-dialog", size === "sm" && "dialog-sm")}
      >
        <Header
          description={description}
          descriptionId={descriptionId}
          icon={icon}
          locked={locked}
          onClose={onClose}
          title={title}
          titleId={titleId}
        />
        <div className="dialog-body">{children}</div>
        {footer ? <div className="dialog-foot">{footer}</div> : null}
      </div>
    </div>
  );
}

export function Sheet({
  children,
  description,
  initialFocusRef,
  locked = false,
  onClose,
  title,
}: Omit<OverlayProps, "footer" | "icon" | "role">) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  useOverlayBehaviour(panelRef, initialFocusRef);

  return (
    <div
      className="overlay overlay-sheet"
      onKeyDown={(e) => {
        if (e.key !== "Escape") return;
        e.stopPropagation();
        if (!locked) onClose();
      }}
    >
      <div className="overlay-scrim anim-overlay" onClick={locked ? undefined : onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className="sheet anim-sheet"
      >
        <Header
          description={description}
          descriptionId={descriptionId}
          locked={locked}
          onClose={onClose}
          title={title}
          titleId={titleId}
        />
        <div className="dialog-body">{children}</div>
      </div>
    </div>
  );
}
