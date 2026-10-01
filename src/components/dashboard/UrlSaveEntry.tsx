import { forwardRef, useState } from "react";
import { CornerDownLeft, Link2, LoaderCircle, TriangleAlert } from "lucide-react";
import { requestMetadataPreview } from "@/features/bookmarks/metadataApi";
import type { Collection, MetadataPreview } from "@/lib/types";

type UrlSaveEntryProps = {
  activeCollection: Collection | null;
  onPreviewReady: (preview: MetadataPreview) => void;
};

export const UrlSaveEntry = forwardRef<HTMLInputElement, UrlSaveEntryProps>(function UrlSaveEntry(
  { activeCollection, onPreviewReady },
  inputRef,
) {
  const [urlInput, setUrlInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const disabled = !activeCollection;

  async function handleSubmit() {
    const trimmed = urlInput.trim();
    if (!trimmed || isLoading) return;
    if (!/^https?:\/\//i.test(trimmed)) {
      setError("Links need to start with http:// or https://. Paste the full address from your browser.");
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
          : "The preview couldn’t be generated. Check the link and try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="savebar-wrap">
      <form
        className="savebar"
        noValidate
        data-disabled={disabled}
        onSubmit={(e) => {
          e.preventDefault();
          void handleSubmit();
        }}
      >
        {isLoading ? (
          <LoaderCircle className="spinner" size={17} strokeWidth={1.75} aria-hidden="true" />
        ) : (
          <Link2 size={17} strokeWidth={1.75} aria-hidden="true" />
        )}
        <input
          ref={inputRef}
          type="url"
          inputMode="url"
          name="url"
          autoComplete="off"
          spellCheck={false}
          placeholder={
            disabled
              ? "Create a collection to start saving links…"
              : `Paste a link to save to ${activeCollection.name}…`
          }
          value={urlInput}
          onChange={(e) => {
            setUrlInput(e.target.value);
            if (error) setError(null);
          }}
          disabled={disabled || isLoading}
          aria-label="Link to save"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "savebar-error" : undefined}
        />
        {isLoading ? (
          <span className="savebar-status" role="status">
            Fetching preview…
          </span>
        ) : (
          <button type="submit" className="btn btn-secondary btn-sm" disabled={disabled || !urlInput.trim()}>
            Fetch preview
            <CornerDownLeft size={13} strokeWidth={1.75} aria-hidden="true" />
          </button>
        )}
      </form>

      {error ? (
        <div id="savebar-error" className="notice notice-danger" role="alert">
          <TriangleAlert size={15} strokeWidth={1.75} />
          <div className="notice-body">{error}</div>
        </div>
      ) : null}
    </div>
  );
});
