import { SiteLayout } from "@/components/site/SiteLayout";
import { GitHubMark } from "@/components/ui/BrandIcons";
import { AUTHOR_GITHUB, AUTHOR_NAME } from "@/lib/site";

export function AboutPage() {
  return (
    <SiteLayout>
      <article className="prose-page">
        <h1 className="display">Why I built this.</h1>

        <div className="prose">
          <p>
            I’ve been a developer for a while, and for most of that time my bookmark situation was
            embarrassing. Hundreds of tabs. A browser bookmarks folder I hadn’t opened in two years. A
            Notion database I set up once and abandoned. Links sent to myself over Slack.
          </p>
          <p>
            Every time I wanted to re-find something (an article about async Rust I half-read three
            weeks ago, the repo for that one CLI tool a colleague mentioned), I’d spend ten minutes
            searching. And I’d usually just Google it again instead.
          </p>
          <p>
            The tools that exist are either built for a general audience (too much structure, too slow
            to save) or too minimal (no search, no tags, no way to tell a blog post from a GitHub repo).
            None of them felt like they were built for the way I actually work: keyboard-first, quick to
            save, quick to find.
          </p>
          <p>
            So I built DevLinks. Paste a URL, get the metadata back, tag it, move on. When you need it
            again, search. That’s the whole thing.
          </p>
          <p>
            It’s opinionated. It’s built for developers. And it’s exactly what I wish had existed three
            years ago.
          </p>
        </div>

        <div className="author-card">
          <span className="avatar">
            <img src={`${AUTHOR_GITHUB}.png?size=104`} alt="" width={52} height={52} loading="lazy" />
          </span>
          <div>
            <p className="author-card-name">{AUTHOR_NAME}</p>
            <p className="author-card-role">Designed and built DevLinks</p>
          </div>
          <a className="btn btn-secondary" href={AUTHOR_GITHUB} target="_blank" rel="noopener noreferrer">
            <GitHubMark size={15} />
            GitHub profile
          </a>
        </div>
      </article>
    </SiteLayout>
  );
}
