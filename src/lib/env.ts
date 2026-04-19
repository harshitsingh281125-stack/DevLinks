const ENV_KEYS = {
  supabaseUrl: "VITE_SUPABASE_URL",
  supabasePublishableKey: "VITE_SUPABASE_PUBLISHABLE_KEY",
  appUrl: "VITE_APP_URL",
} as const;

function readOptionalEnv(key: string) {
  const value = import.meta.env[key];

  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function readRequiredEnv(key: string) {
  const value = readOptionalEnv(key);

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}

export const env = {
  supabaseUrl: readOptionalEnv(ENV_KEYS.supabaseUrl),
  supabasePublishableKey: readOptionalEnv(ENV_KEYS.supabasePublishableKey),
  appUrl: readOptionalEnv(ENV_KEYS.appUrl) ?? window.location.origin,
};

export const requiredEnv = {
  supabaseUrl: readRequiredEnv(ENV_KEYS.supabaseUrl),
  supabasePublishableKey: readRequiredEnv(ENV_KEYS.supabasePublishableKey),
};
