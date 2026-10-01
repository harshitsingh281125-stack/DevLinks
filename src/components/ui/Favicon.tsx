import { useState } from "react";

/** Site favicon in a small tile, falling back to the domain's first letter. */
export function Favicon({ domain, src }: { domain: string | null; src: string | null }) {
  const [failed, setFailed] = useState(false);
  const letter = domain?.replace(/^www\./, "")[0]?.toUpperCase() ?? "?";

  return (
    <span className="favicon" aria-hidden="true">
      {src && !failed ? (
        <img src={src} alt="" width={16} height={16} loading="lazy" onError={() => setFailed(true)} />
      ) : (
        letter
      )}
    </span>
  );
}
