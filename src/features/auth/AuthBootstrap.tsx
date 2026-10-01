import { useEffect, useRef, type PropsWithChildren } from "react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import {
  authBootstrapStarted,
  authSessionChanged,
  selectAuthInitialized,
  selectAuthSession,
  selectCurrentUser,
  selectProfileSyncError,
  selectProfileSyncStatus,
  profileSyncFailed,
  profileSyncStarted,
  profileSyncSucceeded,
} from "@/features/auth/authSlice";
import { LogoMark } from "@/components/ui/Logo";
import { syncProfile } from "@/features/auth/profileBootstrap";
import { track } from "@/lib/analytics";
import { supabase } from "@/lib/supabase";

export function AuthBootstrap({ children }: PropsWithChildren) {
  const dispatch = useAppDispatch();
  const initialized = useAppSelector(selectAuthInitialized);
  const session = useAppSelector(selectAuthSession);
  const user = useAppSelector(selectCurrentUser);
  const profileSyncStatus = useAppSelector(selectProfileSyncStatus);
  const profileSyncError = useAppSelector(selectProfileSyncError);
  const lastSyncedUserIdRef = useRef<string | null>(null);
  const syncingUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    let active = true;

    dispatch(authBootstrapStarted());

    void supabase.auth.getSession().then(({ data, error }) => {
      if (!active) {
        return;
      }

      if (error) {
        dispatch(authSessionChanged(null));
        return;
      }

      dispatch(authSessionChanged(data.session));
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      dispatch(authSessionChanged(session));
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [dispatch]);

  useEffect(() => {
    if (!session || !user) {
      lastSyncedUserIdRef.current = null;
      syncingUserIdRef.current = null;
      return;
    }

    if (
      lastSyncedUserIdRef.current === user.id &&
      profileSyncStatus === "synced"
    ) {
      return;
    }

    if (syncingUserIdRef.current === user.id) {
      return;
    }

    syncingUserIdRef.current = user.id;
    dispatch(profileSyncStarted());

    void syncProfile(user)
      .then(({ profile, isNewUser }) => {
        syncingUserIdRef.current = null;
        lastSyncedUserIdRef.current = user.id;
        dispatch(profileSyncSucceeded(profile));
        if (isNewUser) {
          track({ name: "signup", props: { userId: user.id } });
        }
      })
      .catch((error: unknown) => {
        syncingUserIdRef.current = null;
        const message =
          error instanceof Error ? error.message : "Failed to sync profile.";

        dispatch(profileSyncFailed(message));
      });
  }, [dispatch, profileSyncStatus, session, user]);

  if (!initialized || (session && profileSyncStatus === "syncing")) {
    // Usually visible for a few hundred milliseconds, so it stays quiet: the
    // mark alone, with the status for assistive tech.
    return (
      <div className="boot" role="status">
        <LogoMark className="boot-mark" />
        <span className="sr-only">{!initialized ? "Restoring your session…" : "Loading your profile…"}</span>
      </div>
    );
  }

  if (session && profileSyncStatus === "failed") {
    return (
      <div className="center-state" role="alert" style={{ minHeight: "100dvh" }}>
        <LogoMark className="boot-mark" />
        <h1 className="center-state-title">Your profile didn’t load.</h1>
        <p className="center-state-text">
          {profileSyncError ?? "The profile row could not be created or updated."} Reload to try again. If it
          keeps happening, sign out and back in.
        </p>
        <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
          Reload
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
