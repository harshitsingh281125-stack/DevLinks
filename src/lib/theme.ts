import { useSyncExternalStore } from "react";

// Theme preference lives on <html data-theme>. With no attribute the CSS follows
// prefers-color-scheme; "light" / "dark" pin it. index.html applies the stored
// value before first paint so there is no flash.

export type ThemePreference = "system" | "light" | "dark";

const STORAGE_KEY = "devlinks:theme";
const listeners = new Set<() => void>();

function readPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : "system";
  } catch {
    return "system";
  }
}

let current: ThemePreference = typeof window === "undefined" ? "system" : readPreference();

export function setThemePreference(next: ThemePreference) {
  current = next;
  const root = document.documentElement;
  if (next === "system") delete root.dataset.theme;
  else root.dataset.theme = next;
  try {
    if (next === "system") localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Storage can be unavailable (private mode); the choice still applies for this visit.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useThemePreference(): [ThemePreference, (next: ThemePreference) => void] {
  const preference = useSyncExternalStore(subscribe, () => current, () => "system" as const);
  return [preference, setThemePreference];
}
