import { useState } from "react";
import {
  authConfig,
  buildAuthRedirectUrl,
  DEFAULT_AUTH_REDIRECT_PATH,
} from "@/features/auth/config";
import { supabase } from "@/lib/supabase";

export function useAuthActions() {
  const [isWorking, setIsWorking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const signInWithGitHub = async (redirectPath = DEFAULT_AUTH_REDIRECT_PATH) => {
    setIsWorking(true);
    setErrorMessage(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: authConfig.provider,
      options: {
        redirectTo: buildAuthRedirectUrl(redirectPath),
      },
    });

    if (error) {
      setErrorMessage(error.message);
      setIsWorking(false);
      return { error };
    }

    return { error: null };
  };

  const signOut = async () => {
    setIsWorking(true);
    setErrorMessage(null);

    const { error } = await supabase.auth.signOut();

    setIsWorking(false);

    if (error) {
      setErrorMessage(error.message);
    }

    return { error };
  };

  return {
    errorMessage,
    isWorking,
    signInWithGitHub,
    signOut,
  };
}
