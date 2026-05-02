import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import type { ResourceType, SearchFilters } from "@/lib/types";

// Maps SearchFilters field names to URL parameter keys.
const PARAM: Record<keyof SearchFilters, string> = {
  query: "q",
  collectionId: "cid",
  tag: "tag",
  resourceType: "type",
};

export function useSearchFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters: SearchFilters = {
    query: searchParams.get(PARAM.query) ?? "",
    collectionId: searchParams.get(PARAM.collectionId),
    tag: searchParams.get(PARAM.tag),
    resourceType: (searchParams.get(PARAM.resourceType) as ResourceType | null) || null,
  };

  // collectionId changes are real navigation — push a history entry so back works.
  // query / tag / resourceType changes are view refinements — replace the current entry.
  const setFilter = useCallback(
    <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          const param = PARAM[key];
          if (value === null || value === "") {
            next.delete(param);
          } else {
            next.set(param, String(value));
          }
          return next;
        },
        { replace: key !== "collectionId" },
      );
    },
    [setSearchParams],
  );

  const clearFilter = useCallback(
    (key: keyof SearchFilters) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete(PARAM[key]);
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  // Clears query, tag, and resourceType but preserves the selected collection.
  const resetFilters = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete(PARAM.query);
        next.delete(PARAM.tag);
        next.delete(PARAM.resourceType);
        return next;
      },
      { replace: true },
    );
  }, [setSearchParams]);

  return { filters, setFilter, clearFilter, resetFilters };
}
