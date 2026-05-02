import { env } from "@/lib/env";

export const DEFAULT_AUTH_REDIRECT_PATH = "/app";

export function buildAuthRedirectUrl(path = DEFAULT_AUTH_REDIRECT_PATH) {
  return new URL(path, env.appUrl).toString();
}

export const authConfig = {
  provider: "github" as const,
  redirectTo: buildAuthRedirectUrl(),
};
