import type { MetadataFetchStatus, MetadataPreview } from "@/lib/types";

type MetadataError = {
  error: string;
  fetchStatus: MetadataFetchStatus;
};

function isMetadataPreview(value: unknown): value is MetadataPreview {
  return (
    typeof value === "object" &&
    value !== null &&
    "url" in value &&
    "normalizedUrl" in value &&
    "fetchStatus" in value
  );
}

export async function requestMetadataPreview(url: string) {
  const response = await fetch("/api/metadata", {
    body: JSON.stringify({ url }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  const payload = (await response.json()) as MetadataPreview | MetadataError;

  if (!response.ok || !isMetadataPreview(payload)) {
    const errorPayload = payload as MetadataError;

    throw {
      fetchStatus: errorPayload.fetchStatus ?? "error",
      message: errorPayload.error ?? "Metadata preview could not be generated.",
    };
  }

  return payload;
}
