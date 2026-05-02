import type { Session, User } from "@supabase/supabase-js";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Profile } from "@/lib/types";
import type { RootState } from "@/app/store";

export type AuthStatus = "bootstrapping" | "authenticated" | "unauthenticated";
export type ProfileSyncStatus = "idle" | "syncing" | "synced" | "failed";

type AuthState = {
  initialized: boolean;
  status: AuthStatus;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  profileSyncStatus: ProfileSyncStatus;
  profileSyncError: string | null;
};

const initialState: AuthState = {
  initialized: false,
  status: "bootstrapping",
  session: null,
  user: null,
  profile: null,
  profileSyncStatus: "idle",
  profileSyncError: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    authBootstrapStarted(state) {
      state.initialized = false;
      state.status = "bootstrapping";
    },
    authSessionChanged(state, action: PayloadAction<Session | null>) {
      state.initialized = true;
      state.session = action.payload;
      state.user = action.payload?.user ?? null;
      state.status = action.payload ? "authenticated" : "unauthenticated";
      state.profile = null;
      state.profileSyncStatus = "idle";
      state.profileSyncError = null;
    },
    profileSyncStarted(state) {
      state.profileSyncStatus = "syncing";
      state.profileSyncError = null;
    },
    profileSyncSucceeded(state, action: PayloadAction<Profile>) {
      state.profile = action.payload;
      state.profileSyncStatus = "synced";
      state.profileSyncError = null;
    },
    profileSyncFailed(state, action: PayloadAction<string>) {
      state.profileSyncStatus = "failed";
      state.profileSyncError = action.payload;
    },
  },
});

export const {
  authBootstrapStarted,
  authSessionChanged,
  profileSyncStarted,
  profileSyncSucceeded,
  profileSyncFailed,
} = authSlice.actions;
export const authReducer = authSlice.reducer;

export const selectAuth = (state: RootState) => state.auth;
export const selectAuthInitialized = (state: RootState) => state.auth.initialized;
export const selectAuthSession = (state: RootState) => state.auth.session;
export const selectAuthStatus = (state: RootState) => state.auth.status;
export const selectCurrentUser = (state: RootState) => state.auth.user;
export const selectCurrentProfile = (state: RootState) => state.auth.profile;
export const selectIsAuthenticated = (state: RootState) =>
  state.auth.status === "authenticated";
export const selectProfileSyncStatus = (state: RootState) =>
  state.auth.profileSyncStatus;
export const selectProfileSyncError = (state: RootState) =>
  state.auth.profileSyncError;
