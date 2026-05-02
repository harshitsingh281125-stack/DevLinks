import { AlertTriangle, Loader2 } from "lucide-react";
import { useState } from "react";
import { requestMetadataPreview } from "@/features/bookmarks/metadataApi";
import type { Collection, MetadataPreview } from "@/lib/types";

type UrlSaveEntryProps = {
  activeCollection: Collection | null;
  onOpenSaveModal: () => void;
  onPreviewReady: (preview: MetadataPreview) => void;
  preview: MetadataPreview | null;
};

export function UrlSaveEntry({
  activeCollection,
  onPreviewReady,
}: UrlSaveEntryProps) {
  const [urlInput, setUrlInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      setError("Enter a valid URL starting with https://");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const preview = await requestMetadataPreview(trimmed);
      onPreviewReady(preview);
      setUrlInput("");
    } catch (err) {
      setError(
        typeof err === "object" && err !== null && "message" in err
          ? String((err as { message: unknown }).message)
          : "Metadata preview could not be generated.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="dl-addbar-loading">
        <span className="dl-addbar-prompt">$&nbsp;save</span>
        <Loader2 size={13} className="dl-spinner" style={{ color: "var(--accent)" }} />
        <span>fetching metadata…</span>
      </div>
    );
  }

  return (
    <>
      {!activeCollection ? (
        <div className="dl-fetch-notice warn">
          <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>Create or select a collection before saving a bookmark.</span>
        </div>
      ) : null}

      <div className="dl-addbar">
        <span className="dl-addbar-prompt">$&nbsp;save</span>
        <input
          type="text"
          placeholder="paste a URL to save — https://…"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void handleSubmit();
          }}
          disabled={!activeCollection}
          aria-label="URL to save"
        />
        <span className="dl-addbar-hint">
          <span className="dl-kbd">⏎</span> to save
        </span>
      </div>

      {error ? (
        <div className="dl-fetch-notice error" style={{ marginTop: -8, marginBottom: 10 }}>
          <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>{error}</span>
        </div>
      ) : null}
    </>
  );
}
