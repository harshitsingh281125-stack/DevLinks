import { Folder, FolderOpen, Globe, Pencil, Plus } from "lucide-react";
import type { Collection } from "@/lib/types";

type CollectionsSidebarProps = {
  collectionCounts: Record<string, number>;
  collections: Collection[];
  isLoading: boolean;
  onCreateCollection: () => void;
  onEditCollection: (collection: Collection) => void;
  onSelectCollection: (collectionId: string | null) => void;
  selectedCollectionId: string | null;
};

export function CollectionsSidebar({
  collectionCounts,
  collections,
  isLoading,
  onCreateCollection,
  onEditCollection,
  onSelectCollection,
  selectedCollectionId,
}: CollectionsSidebarProps) {
  return (
    <nav className="side-section" aria-label="Collections">
      <div className="side-label">
        <span>Collections</span>
        <button
          type="button"
          className="icon-btn icon-btn-sm"
          onClick={onCreateCollection}
          aria-label="New collection"
          title="New collection"
        >
          <Plus size={15} strokeWidth={1.75} />
        </button>
      </div>

      {isLoading && collections.length === 0 ? (
        <div className="side-item side-item-muted">Loading…</div>
      ) : collections.length === 0 ? (
        <button type="button" className="side-item" onClick={onCreateCollection}>
          <Plus className="side-item-icon" size={15} strokeWidth={1.75} aria-hidden="true" />
          <span className="side-item-label">Create your first collection</span>
        </button>
      ) : (
        collections.map((c) => {
          const isSelected = selectedCollectionId === c.id;
          const Icon = isSelected ? FolderOpen : Folder;
          const count = collectionCounts[c.id];
          return (
            <div key={c.id} className="side-row">
              <button
                type="button"
                className="side-item"
                aria-current={isSelected ? "true" : undefined}
                onClick={() => onSelectCollection(c.id)}
              >
                <Icon className="side-item-icon" size={15} strokeWidth={1.75} aria-hidden="true" />
                <span className="side-item-label">{c.name}</span>
                {c.isPublic ? (
                  <Globe size={13} strokeWidth={1.75} aria-label="Public" role="img" />
                ) : null}
                {count !== undefined ? <span className="side-item-count">{count}</span> : null}
              </button>
              <button
                type="button"
                className="icon-btn icon-btn-sm side-row-edit"
                onClick={() => onEditCollection(c)}
                aria-label={`Edit ${c.name}`}
                title="Edit collection"
              >
                <Pencil size={13} strokeWidth={1.75} />
              </button>
            </div>
          );
        })
      )}
    </nav>
  );
}
