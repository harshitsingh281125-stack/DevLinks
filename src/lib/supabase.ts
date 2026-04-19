import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { requiredEnv } from "./env";

function createBrowserSupabaseClient() {
  return createClient(requiredEnv.supabaseUrl, requiredEnv.supabasePublishableKey, {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: true,
      persistSession: true,
    },
  });
}

function resolveSupabaseClient(): SupabaseClient {
  if (typeof window !== "undefined" && window.__DEVLINKS_SUPABASE__) {
    return window.__DEVLINKS_SUPABASE__;
  }

  return createBrowserSupabaseClient();
}

export const supabase = resolveSupabaseClient();
