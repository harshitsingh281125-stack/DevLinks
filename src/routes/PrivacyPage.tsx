import { SiteLayout } from "@/components/site/SiteLayout";
import { CONTACT_EMAIL } from "@/lib/site";

// Policy wording is unchanged from the previous version; only layout and
// punctuation were touched. Get sign-off before editing the substance.

export function PrivacyPage() {
  return (
    <SiteLayout>
      <article className="prose-page">
        <h1 className="display">Your data is yours.</h1>
        <p className="prose-meta">Last updated May 2026</p>

        <div className="prose">
          <h2 id="what-we-collect">What we collect</h2>
          <p>
            When you sign in with GitHub, we receive your GitHub username, display name, and email
            address. We use these to create and identify your account, and nothing else.
          </p>
          <p>
            We store the URLs you save along with the metadata we fetch for them (title, description,
            domain, favicon). We also store the tags and collections you create.
          </p>

          <h2 id="what-we-dont-collect">What we don’t collect</h2>
          <p>
            We don’t track your browsing history outside DevLinks. We don’t sell your data. We don’t
            run ads. We don’t use third-party analytics that profile you across the web.
          </p>

          <h2 id="where-your-data-lives">Where your data lives</h2>
          <p>
            Your data is stored in a Supabase Postgres database hosted in the EU. Authentication is
            handled by Supabase Auth. Neither we nor Supabase will sell or share your personal data with
            third parties.
          </p>

          <h2 id="public-collections">Public collections</h2>
          <p>
            Collections are private by default. If you choose to make a collection public, its contents
            become visible to anyone with the link, no login required. You can revoke public access at
            any time and the page will immediately become inaccessible.
          </p>

          <h2 id="export-and-deletion">Data export and deletion</h2>
          <p>
            You can export all your bookmarks as JSON or Markdown at any time from your account
            settings. To permanently delete your account and all associated data, contact us at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> and we’ll process the request within
            7 days.
          </p>

          <h2 id="cookies">Cookies</h2>
          <p>
            We use a single session cookie to keep you signed in. No tracking cookies. No third-party
            cookies.
          </p>

          <h2 id="changes">Changes to this policy</h2>
          <p>
            If we make material changes to this policy, we’ll update the date at the top of this page.
            Continued use of DevLinks after changes constitutes acceptance of the updated policy.
          </p>

          <p style={{ marginTop: 40 }}>
            Questions? Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
          </p>
        </div>
      </article>
    </SiteLayout>
  );
}
