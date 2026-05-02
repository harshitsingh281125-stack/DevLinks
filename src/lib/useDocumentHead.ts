import { useEffect } from "react";
import type { CollectionMeta } from "./seo";

/**
 * Applies `meta` values to the document <head> and cleans up on unmount.
 *
 * A fresh set of <meta> and <link rel="canonical"> tags is appended each time
 * the hook activates.  The previous document.title is restored on cleanup so
 * navigating away from a public page doesn't leave stale tags.
 */
export function useDocumentHead(meta: CollectionMeta): void {
  const {
    title,
    description,
    ogTitle,
    ogDescription,
    ogType,
    ogUrl,
    ogSiteName,
    twitterCard,
    twitterTitle,
    twitterDescription,
    canonical,
  } = meta;

  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;

    const injected: Element[] = [];

    function injectMeta(attrs: Record<string, string>): void {
      const el = document.createElement("meta");
      for (const [k, v] of Object.entries(attrs)) {
        el.setAttribute(k, v);
      }
      document.head.appendChild(el);
      injected.push(el);
    }

    injectMeta({ name: "description", content: description });
    injectMeta({ property: "og:title", content: ogTitle });
    injectMeta({ property: "og:description", content: ogDescription });
    injectMeta({ property: "og:type", content: ogType });
    injectMeta({ property: "og:url", content: ogUrl });
    injectMeta({ property: "og:site_name", content: ogSiteName });
    injectMeta({ name: "twitter:card", content: twitterCard });
    injectMeta({ name: "twitter:title", content: twitterTitle });
    injectMeta({ name: "twitter:description", content: twitterDescription });

    const canonicalEl = document.createElement("link");
    canonicalEl.setAttribute("rel", "canonical");
    canonicalEl.setAttribute("href", canonical);
    document.head.appendChild(canonicalEl);
    injected.push(canonicalEl);

    return () => {
      document.title = previousTitle;
      for (const el of injected) {
        el.remove();
      }
    };
  }, [
    title,
    description,
    ogTitle,
    ogDescription,
    ogType,
    ogUrl,
    ogSiteName,
    twitterCard,
    twitterTitle,
    twitterDescription,
    canonical,
  ]);
}
