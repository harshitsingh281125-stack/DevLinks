import { cn } from "@/lib/utils";

/** The DevLinks mark: a bookmark ribbon on a vermilion tile. Matches /favicon.svg. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg className={cn("logo-mark", className)} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="var(--accent)" />
      <path d="M11 8.5h10v15.5l-5-3.75L11 24z" fill="#fff" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("logo", className)} translate="no">
      <LogoMark />
      DevLinks
    </span>
  );
}
