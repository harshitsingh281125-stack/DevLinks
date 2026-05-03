import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Camera, Globe, MapPin, User } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { selectCurrentProfile, selectCurrentUser, profileSyncSucceeded } from "@/features/auth/authSlice";
import {
  useUpdateMyProfileMutation,
  useUploadAvatarMutation,
} from "@/features/profile/profileApi";

// ─── Avatar upload button ─────────────────────────────────────────────────────

function AvatarUpload({
  currentUrl,
  initials,
  onUpload,
  isUploading,
}: {
  currentUrl: string | null;
  initials: string;
  onUpload: (file: File) => void;
  isUploading: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="relative w-fit">
      <div className="h-20 w-20 rounded-full overflow-hidden bg-white/10 flex items-center justify-center text-2xl font-semibold text-white border border-white/20">
        {currentUrl ? (
          <img src={currentUrl} alt="Avatar" className="h-full w-full object-cover" />
        ) : initials ? (
          <span>{initials}</span>
        ) : (
          <User className="h-8 w-8 text-sand-200/50" />
        )}
      </div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-cyan-400 text-ink-950 shadow-md transition hover:bg-cyan-300 disabled:opacity-50"
        aria-label="Upload avatar"
      >
        {isUploading ? (
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-ink-950 border-t-transparent" />
        ) : (
          <Camera className="h-3.5 w-3.5" />
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

// ─── Field ────────────────────────────────────────────────────────────────────

function Field({
  label,
  hint,
  icon,
  children,
}: {
  label: string;
  hint?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-sand-200/60">
        {icon}
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs text-sand-200/40">{hint}</p> : null}
    </div>
  );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-sand-200/30 outline-none transition focus:border-cyan-400/60 disabled:opacity-50"
    />
  );
}

function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      rows={3}
      className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-sand-200/30 outline-none transition focus:border-cyan-400/60 disabled:opacity-50"
    />
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function ProfilePage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  const profile = useAppSelector(selectCurrentProfile);

  const [updateProfile, { isLoading: isSaving, error: saveError }] = useUpdateMyProfileMutation();
  const [uploadAvatar, { isLoading: isUploading }] = useUploadAvatarMutation();

  const [displayName, setDisplayName] = useState(profile?.displayName ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [location, setLocation] = useState(profile?.location ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(profile?.websiteUrl ?? "");
  const [twitterHandle, setTwitterHandle] = useState(profile?.twitterHandle ?? "");
  const [linkedinUrl, setLinkedinUrl] = useState(profile?.linkedinUrl ?? "");
  const [githubUsername, setGithubUsername] = useState(profile?.githubUsername ?? "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatarUrl ?? null);
  const [saved, setSaved] = useState(false);

  // Re-sync form if profile arrives after mount (e.g. slow network)
  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.displayName ?? "");
    setBio(profile.bio ?? "");
    setLocation(profile.location ?? "");
    setWebsiteUrl(profile.websiteUrl ?? "");
    setTwitterHandle(profile.twitterHandle ?? "");
    setLinkedinUrl(profile.linkedinUrl ?? "");
    setGithubUsername(profile.githubUsername ?? "");
    setAvatarUrl(profile.avatarUrl ?? null);
  }, [profile?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");

  async function handleAvatarUpload(file: File) {
    if (!user) return;
    const result = await uploadAvatar({ userId: user.id, file });
    if ("data" in result && result.data) {
      setAvatarUrl(result.data);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    const result = await updateProfile({
      userId: user.id,
      payload: {
        displayName: displayName.trim() || null,
        bio: bio.trim() || null,
        location: location.trim() || null,
        websiteUrl: websiteUrl.trim() || null,
        twitterHandle: twitterHandle.trim() || null,
        linkedinUrl: linkedinUrl.trim() || null,
        githubUsername: githubUsername.trim() || null,
        avatarUrl,
      },
    });

    if ("data" in result && result.data) {
      dispatch(profileSyncSucceeded(result.data));
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  }

  const errorMessage =
    saveError != null && typeof saveError === "object" && "message" in saveError
      ? String((saveError as { message: unknown }).message)
      : null;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12">
      <Link
        to="/app"
        className="inline-flex items-center gap-1.5 text-sm text-sand-200/50 transition hover:text-white"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to dashboard
      </Link>

      <h1 className="mt-6 text-2xl font-semibold text-white">Your profile</h1>
      <p className="mt-1 text-sm text-sand-200/55">
        Shown to visitors of your public collections.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-8">
        {/* Avatar + display name */}
        <div className="flex items-start gap-6">
          <AvatarUpload
            currentUrl={avatarUrl}
            initials={initials}
            onUpload={handleAvatarUpload}
            isUploading={isUploading}
          />
          <div className="flex-1">
            <Field label="Display name">
              <TextInput
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                maxLength={60}
              />
            </Field>
          </div>
        </div>

        {/* Bio */}
        <Field label="Bio" hint="A short description shown on your public collections.">
          <TextArea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="What do you work on? What are you into?"
            maxLength={200}
          />
        </Field>

        {/* Location */}
        <Field label="Location" icon={<MapPin className="h-3 w-3" />}>
          <TextInput
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="City, Country"
            maxLength={60}
          />
        </Field>

        <div className="border-t border-white/8" />

        {/* Links */}
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Website" icon={<Globe className="h-3 w-3" />}>
            <TextInput
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://yoursite.dev"
            />
          </Field>

          <Field label="GitHub">
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-sand-200/40">
                github.com/
              </span>
              <input
                value={githubUsername}
                onChange={(e) => setGithubUsername(e.target.value)}
                placeholder="username"
                maxLength={39}
                className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-[6.5rem] pr-3 text-sm text-white placeholder:text-sand-200/30 outline-none transition focus:border-cyan-400/60"
              />
            </div>
          </Field>

          <Field label="Twitter / X">
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-sand-200/40">
                @
              </span>
              <input
                value={twitterHandle}
                onChange={(e) => setTwitterHandle(e.target.value)}
                placeholder="handle"
                maxLength={50}
                className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-7 pr-3 text-sm text-white placeholder:text-sand-200/30 outline-none transition focus:border-cyan-400/60"
              />
            </div>
          </Field>

          <Field label="LinkedIn">
            <TextInput
              type="url"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="https://linkedin.com/in/you"
            />
          </Field>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2">
          {errorMessage ? (
            <p className="text-sm text-rose-300">{errorMessage}</p>
          ) : saved ? (
            <p className="text-sm text-emerald-400">Profile saved.</p>
          ) : (
            <span />
          )}
          <button
            type="submit"
            disabled={isSaving || isUploading}
            className="rounded-full bg-cyan-400 px-6 py-2.5 text-sm font-semibold text-ink-950 transition hover:bg-cyan-300 disabled:opacity-50"
          >
            {isSaving ? "Saving…" : "Save profile"}
          </button>
        </div>
      </form>
    </div>
  );
}
