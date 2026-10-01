import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Camera, LoaderCircle } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { Logo } from "@/components/ui/Logo";
import { ThemeSwitch } from "@/components/ui/ThemeSwitch";
import { selectCurrentProfile, selectCurrentUser, profileSyncSucceeded } from "@/features/auth/authSlice";
import { useUpdateMyProfileMutation, useUploadAvatarMutation } from "@/features/profile/profileApi";

// ─── Pieces ───────────────────────────────────────────────────────────────────

function Field({
  children,
  hint,
  htmlFor,
  label,
}: {
  children: React.ReactNode;
  hint?: string;
  htmlFor: string;
  label: string;
}) {
  return (
    <div className="field">
      <label className="label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {hint ? <p className="hint">{hint}</p> : null}
    </div>
  );
}

function AvatarUpload({
  currentUrl,
  initials,
  isUploading,
  onUpload,
}: {
  currentUrl: string | null;
  initials: string;
  isUploading: boolean;
  onUpload: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="avatar-field">
      <span className="avatar">
        {currentUrl ? <img src={currentUrl} alt="" width={64} height={64} /> : initials || "?"}
      </span>
      <div>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? (
            <LoaderCircle className="spinner" size={14} strokeWidth={1.75} aria-hidden="true" />
          ) : (
            <Camera size={14} strokeWidth={1.75} aria-hidden="true" />
          )}
          {isUploading ? "Uploading…" : currentUrl ? "Change photo" : "Upload photo"}
        </button>
        <p className="hint" style={{ marginTop: 6 }}>
          JPG, PNG, WebP, or GIF.
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        tabIndex={-1}
        aria-label="Upload profile photo"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function ProfilePage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  const profile = useAppSelector(selectCurrentProfile);

  const [updateProfile, { isLoading: isSaving, error: saveError }] = useUpdateMyProfileMutation();
  const [uploadAvatar, { isLoading: isUploading, error: uploadError }] = useUploadAvatarMutation();

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

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 3000);
    return () => clearTimeout(t);
  }, [saved]);

  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");

  async function handleAvatarUpload(file: File) {
    if (!user) return;
    const result = await uploadAvatar({ userId: user.id, file });
    if ("data" in result && result.data) setAvatarUrl(result.data);
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
        twitterHandle: twitterHandle.trim().replace(/^@/, "") || null,
        linkedinUrl: linkedinUrl.trim() || null,
        githubUsername: githubUsername.trim() || null,
        avatarUrl,
      },
    });

    if ("data" in result && result.data) {
      dispatch(profileSyncSucceeded(result.data));
      setSaved(true);
    }
  }

  const error = saveError ?? uploadError;
  const errorMessage =
    error != null && typeof error === "object" && "message" in error
      ? String((error as { message: unknown }).message)
      : null;

  return (
    <div className="site">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="plain-header">
        <div className="plain-header-inner">
          <Link to="/app" className="btn btn-ghost btn-sm" style={{ marginLeft: -10 }}>
            <ArrowLeft size={15} strokeWidth={1.75} aria-hidden="true" />
            Dashboard
          </Link>
          <Link to="/" aria-label="DevLinks home">
            <Logo />
          </Link>
          <ThemeSwitch />
        </div>
      </header>

      <main id="main" className="narrow" tabIndex={-1}>
        <h1 className="narrow-title">Profile</h1>
        <p className="narrow-lede">Shown on your public collections. Everything here is optional.</p>

        <form onSubmit={handleSubmit} className="form-panel" noValidate>
          <div className="form-panel-section">
            <AvatarUpload
              currentUrl={avatarUrl}
              initials={initials}
              isUploading={isUploading}
              onUpload={(file) => void handleAvatarUpload(file)}
            />
          </div>

          <div className="form-panel-section">
            <Field htmlFor="profile-name" label="Display name">
              <input
                id="profile-name"
                className="input"
                name="name"
                autoComplete="name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Ada Lovelace…"
                maxLength={60}
              />
            </Field>
            <Field htmlFor="profile-bio" label="Bio" hint={`${bio.length}/200 characters`}>
              <textarea
                id="profile-bio"
                className="textarea"
                name="bio"
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="What you work on, what you read about…"
                maxLength={200}
              />
            </Field>
            <Field htmlFor="profile-location" label="Location">
              <input
                id="profile-location"
                className="input"
                name="location"
                autoComplete="address-level2"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Berlin, Germany…"
                maxLength={60}
              />
            </Field>
          </div>

          <div className="form-panel-section">
            <h2 className="section-title">Links</h2>
            <div className="form-grid" style={{ marginTop: 0 }}>
              <Field htmlFor="profile-website" label="Website">
                <input
                  id="profile-website"
                  className="input"
                  type="url"
                  inputMode="url"
                  name="website"
                  autoComplete="url"
                  spellCheck={false}
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://yoursite.dev…"
                />
              </Field>
              <Field htmlFor="profile-github" label="GitHub">
                <div className="input-affix">
                  <span aria-hidden="true">github.com/</span>
                  <input
                    id="profile-github"
                    name="github"
                    autoComplete="off"
                    spellCheck={false}
                    value={githubUsername}
                    onChange={(e) => setGithubUsername(e.target.value)}
                    placeholder="username…"
                    maxLength={39}
                  />
                </div>
              </Field>
              <Field htmlFor="profile-x" label="X (Twitter)">
                <div className="input-affix">
                  <span aria-hidden="true">@</span>
                  <input
                    id="profile-x"
                    name="twitter"
                    autoComplete="off"
                    spellCheck={false}
                    value={twitterHandle}
                    onChange={(e) => setTwitterHandle(e.target.value)}
                    placeholder="handle…"
                    maxLength={50}
                  />
                </div>
              </Field>
              <Field htmlFor="profile-linkedin" label="LinkedIn">
                <input
                  id="profile-linkedin"
                  className="input"
                  type="url"
                  inputMode="url"
                  name="linkedin"
                  autoComplete="off"
                  spellCheck={false}
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/you…"
                />
              </Field>
            </div>
          </div>

          <div className="form-panel-foot">
            <p
              className={`form-panel-status${errorMessage ? " is-error" : saved ? " is-ok" : ""}`}
              role="status"
              aria-live="polite"
            >
              {errorMessage ?? (saved ? "Profile saved." : "")}
            </p>
            <button type="submit" className="btn btn-primary" disabled={isSaving || isUploading}>
              {isSaving ? "Saving…" : "Save profile"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
