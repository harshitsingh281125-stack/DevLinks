import type { PropsWithChildren } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAppSelector } from "@/app/hooks";
import {
  selectAuthInitialized,
  selectIsAuthenticated,
} from "@/features/auth/authSlice";

export function ProtectedRoute({ children }: PropsWithChildren) {
  const location = useLocation();
  const initialized = useAppSelector(selectAuthInitialized);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  if (!initialized) {
    return null;
  }

  if (!isAuthenticated) {
    const redirectTo = `${location.pathname}${location.search}${location.hash}`;

    return <Navigate to={`/?redirectTo=${encodeURIComponent(redirectTo)}`} replace />;
  }

  return <>{children}</>;
}
