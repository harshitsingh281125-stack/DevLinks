import { describe, expect, it } from "vitest";
import { metaContent, parseMetaTags } from "./html";
import { extractPublisherTags, mergeSuggestedTags, normalizeTag } from "./pageTags";
import { inferSuggestedTags } from "./taggingRules";

// Fixtures mirror the markup each platform actually serves (checked 2026-10).

const DEVTO = `
<meta name="description" content="HTTP cookies are small pieces of data stored on the client side (your browser) that websites use to... Tagged with webdev, javascript, programming, beginners.">
<meta name="keywords" content="webdev, javascript, programming, beginners, software, coding, development, engineering, inclusive, community">
<meta property="og:title" content="HTTP Cookies 🍪" />`;

const GHOST = `
<meta property="article:tag" content="Developer Tools">
<meta property="article:tag" content="React">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"Article","keywords":"Developer Tools, React"}</script>`;

const WORDPRESS = `
<meta property="article:tag" content="flexbox" />
<meta property="article:tag" content="layout" />
<a href="/tag/images/" rel="tag">images</a>`;

const GITHUB = `
<a href="https://github.com/resources/articles?topic=ai">AI</a>
<a href="/topics/build-tool">build-tool</a><a href="/topics/vite">vite</a><a href="/topics/hmr">hmr</a>`;

describe("normalizeTag", () => {
  it.each([
    ["React.js", "react"],
    ["#ReactJS", "react"],
    ["Node.js", "nodejs"],
    ["Next.js", "nextjs"],
    ["golang", "go"],
    ["k8s", "kubernetes"],
    ["C++", "cpp"],
    ["C#", "csharp"],
    [".NET", "dotnet"],
    ["Developer Tools", "devtools"],
    ["Web Development", "webdev"],
    ["CI/CD", "ci-cd"],
    ["Server Side Rendering", "server-side-rendering"],
    ["  state_management ", "state-management"],
  ])("%s → %s", (raw, expected) => {
    expect(normalizeTag(raw)).toBe(expected);
  });

  it.each(["", "#", "a", "2024", "uncategorized", "Featured", "a very long phrase that is clearly a sentence"])(
    "rejects %j",
    (raw) => {
      expect(normalizeTag(raw)).toBeNull();
    },
  );
});

describe("extractPublisherTags", () => {
  it("reads dev.to's 'Tagged with' and drops the site's boilerplate keywords", () => {
    expect(extractPublisherTags(DEVTO, "dev.to")).toEqual(["webdev", "javascript", "programming", "beginners"]);
  });

  it("reads article:tag and JSON-LD keywords without duplicates", () => {
    expect(extractPublisherTags(GHOST, "www.freecodecamp.org")).toEqual(["devtools", "react"]);
  });

  it("ignores rel=tag sidebar links when the article declared its own tags", () => {
    expect(extractPublisherTags(WORDPRESS, "css-tricks.com")).toEqual(["flexbox", "layout"]);
  });

  it("falls back to rel=tag links when nothing else is declared", () => {
    const html = `<a rel="tag" href="/tag/react/">#react</a><a rel="nofollow tag" href="/t/x">Performance</a>`;
    expect(extractPublisherTags(html, "blog.example.com")).toEqual(["react", "performance"]);
  });

  it("reads GitHub repository topics, but only on github.com", () => {
    expect(extractPublisherTags(GITHUB, "github.com")).toEqual(["build-tool", "vite", "hmr"]);
    expect(extractPublisherTags(GITHUB, "example.com")).toEqual([]);
  });

  it("walks JSON-LD @graph and array keywords, skipping invalid JSON", () => {
    const html = `
      <script type="application/ld+json">{ not json </script>
      <script type="application/ld+json">{"@graph":[{"@type":"WebPage"},{"@type":"BlogPosting","keywords":["TypeScript","Generics"]}]}</script>`;
    expect(extractPublisherTags(html, "example.com")).toEqual(["typescript", "generics"]);
  });

  it("keeps meta keywords short, filtered, and capped", () => {
    const html = `<meta name="keywords" content="coding, javascript programming language, React, hooks, software, tips, vite, css, html, sql">`;
    expect(extractPublisherTags(html, "example.com")).toEqual(["react", "hooks", "vite", "css", "html"]);
  });

  it("caps the total at six", () => {
    const html = Array.from({ length: 10 }, (_, i) => `<meta property="article:tag" content="topic${i}">`).join("");
    expect(extractPublisherTags(html, "example.com")).toHaveLength(6);
  });
});

describe("mergeSuggestedTags", () => {
  it("puts the page's tags first, then rule tags, de-duplicated and capped", () => {
    expect(mergeSuggestedTags(["react", "hooks"], ["react", "performance"])).toEqual(["react", "hooks", "performance"]);
    expect(mergeSuggestedTags(["a1", "a2", "a3", "a4", "a5", "a6"], ["b1", "b2", "b3"])).toHaveLength(8);
  });

  it("gives the reported dev.to article its tags back (regression)", () => {
    const meta = parseMetaTags(DEVTO);
    const inferred = inferSuggestedTags(
      "dev.to",
      "/lovestaco/http-cookies-2g13",
      metaContent(meta, "og:title"),
      metaContent(meta, "description"),
    );
    expect(mergeSuggestedTags(extractPublisherTags(DEVTO, "dev.to"), inferred)).toEqual([
      "webdev",
      "javascript",
      "programming",
      "beginners",
      "http",
      "cookies",
    ]);
  });
});

describe("html meta parsing", () => {
  it("keeps apostrophes and decodes numeric entities", () => {
    const meta = parseMetaTags(`<meta content="Rust's ownership &#x27;model&#39; &amp; more" property="og:description">`);
    expect(metaContent(meta, "og:description")).toBe("Rust's ownership 'model' & more");
  });
});
