import { Sheet } from "@/components/ui/Dialog";
import { CollectionEditor, type CollectionEditorProps } from "./CollectionEditor";

type CollectionSheetProps = Omit<CollectionEditorProps, "onClose"> & {
  isOpen: boolean;
  onClose: () => void;
};

export function CollectionSheet({ isOpen, onClose, ...editorProps }: CollectionSheetProps) {
  if (!isOpen) return null;

  const { mode, activeCollection, busyState } = editorProps;

  return (
    <Sheet
      title={mode === "create" ? "New collection" : "Collection settings"}
      description={
        mode === "create"
          ? "Group related links. Collections stay private until you share them."
          : activeCollection?.name
      }
      onClose={onClose}
      locked={busyState === "creating" || busyState === "updating" || busyState === "deleting"}
    >
      <CollectionEditor
        key={mode === "create" ? "create" : activeCollection?.id}
        {...editorProps}
        onClose={onClose}
      />
    </Sheet>
  );
}
