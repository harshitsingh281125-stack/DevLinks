/// <reference types="vite/client" />

import type { SupabaseClient } from "@supabase/supabase-js";

declare global {
  interface ImportMetaEnv {
    readonly VITE_APP_URL?: string;
    readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
    readonly VITE_SUPABASE_URL?: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }

  interface Window {
    __DEVLINKS_SUPABASE__?: SupabaseClient;
  }
}

export {};
