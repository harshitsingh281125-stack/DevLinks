import { Link, useSearchParams } from "react-router-dom";
import { useAppSelector } from "@/app/hooks";
import { GitHubMark } from "@/components/ui/BrandIcons";
import { selectIsAuthenticated } from "@/features/auth/authSlice";
import { DEFAULT_AUTH_REDIRECT_PATH } from "@/features/auth/config";
import { useAuthActions } from "@/features/auth/useAuthActions";
import { cn } from "@/lib/utils";

/** The single sign-in CTA used everywhere on marketing pages. One label per intent. */
export function SignInButton({ size = "md", showError = false }: { size?: "sm" | "md" | "lg"; showError?: boolean }) {
  const [searchParams] = useSearchParams();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const { errorMessage, isWorking, signInWithGitHub } = useAuthActions();
  const redirectTo = searchParams.get("redirectTo") ?? DEFAULT_AUTH_REDIRECT_PATH;
  const sizeClass = size === "sm" ? "btn-sm" : size === "lg" ? "btn-lg" : undefined;

  if (isAuthenticated) {
    return (
      <Link to="/app" className={cn("btn btn-primary", sizeClass)}>
        Open dashboard
      </Link>
    );
  }

  return (
    <>
      <button
        type="button"
        className={cn("btn", size === "sm" ? "btn-secondary" : "btn-primary", sizeClass)}
        onClick={() => void signInWithGitHub(redirectTo)}
        disabled={isWorking}
      >
        <GitHubMark size={size === "lg" ? 17 : 15} />
        {isWorking ? "Redirecting to GitHub…" : "Sign in with GitHub"}
      </button>
      {showError && errorMessage ? (
        <p className="field-error" role="alert" style={{ flexBasis: "100%" }}>
          {errorMessage} Try again, or check that pop-ups and third-party cookies aren’t blocked.
        </p>
      ) : null}
    </>
  );
}
