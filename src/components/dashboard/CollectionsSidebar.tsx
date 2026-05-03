import { Pencil, Plus } from "lucide-react";
import type { Collection } from "@/lib/types";

type CollectionsSidebarProps = {
  collections: Collection[];
  isLoading: boolean;
  onCreateCollection: () => void;
  onEditCollection: (collection: Collection) => void;
  onSelectCollection: (collectionId: string | null) => void;
  selectedCollectionId: string | null;
};

const DOT_PALETTE = [
  "oklch(0.68 0.17 40)",
  "oklch(0.72 0.16 280)",
  "oklch(0.78 0.15 200)",
  "oklch(0.75 0.14 90)",
  "oklch(0.70 0.12 320)",
  "oklch(0.73 0.14 160)",
  "oklch(0.65 0.15 60)",
];

function dotColor(index: number): string {
  return DOT_PALETTE[index % DOT_PALETTE.length] ?? DOT_PALETTE[0]!;
}

export function CollectionsSidebar({
  collections,
  isLoading,
  onCreateCollection,
  onEditCollection,
  onSelectCollection,
  selectedCollectionId,
}: CollectionsSidebarProps) {
  return (
    <>
      <div className="dl-sidebar-section">
        <div className="dl-sidebar-label">
          <span>Collections</span>
          <button
            type="button"
            onClick={onCreateCollection}
            title="New collection"
            aria-label="New collection"
          >
            <Plus size={13} />
          </button>
        </div>

        {isLoading ? (
          <div className="dl-nav-btn" style={{ color: "var(--fg-4)", fontSize: 12 }}>
            Loading…
          </div>
        ) : collections.length === 0 ? (
          <div style={{ padding: "10px", fontFamily: "var(--mono)", fontSize: 11.5, color: "var(--fg-4)", lineHeight: 1.5 }}>
            No collections yet.
          </div>
        ) : (
          collections.map((c, i) => {
            const isSelected = selectedCollectionId === c.id;
            const dot = dotColor(i);
            return (
              <div
                key={c.id}
                className={`dl-nav-row${isSelected ? " active" : ""}`}
                style={{ "--dot": dot } as React.CSSProperties}
              >
                <button
                  type="button"
                  className="dl-nav-row-main"
                  onClick={() => onSelectCollection(c.id)}
                >
                  <span className="dl-nav-dot" />
                  <span className="dl-nav-row-label">{c.name}</span>
                  {c.isPublic && <span className="dl-public-badge">pub</span>}
                </button>
                <button
                  type="button"
                  className="dl-nav-edit-btn"
                  onClick={(e) => { e.stopPropagation(); onEditCollection(c); }}
                  aria-label={`Edit ${c.name}`}
                  title={`Edit ${c.name}`}
                >
                  <Pencil size={11} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
