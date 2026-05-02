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
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-950 px-6 text-center text-sand-100">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">
            DevLinks
          </p>
          <h1 className="text-2xl font-semibold text-white">
            {!initialized ? "Restoring session…" : "Syncing profile…"}
          </h1>
          <p className="max-w-sm text-sm text-sand-200/70">
            {!initialized
              ? "Supabase auth is initializing before the app routes render."
              : "Preparing your DevLinks profile before the app routes render."}
          </p>
        </div>
      </div>
    );
  }

  if (session && profileSyncStatus === "failed") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-950 px-6 text-center text-sand-100">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">
            DevLinks
          </p>
          <h1 className="text-2xl font-semibold text-white">Profile sync failed</h1>
          <p className="max-w-sm text-sm text-rose-200">
            {profileSyncError ?? "The profile row could not be created or updated."}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
