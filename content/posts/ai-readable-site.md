---
title: "Make a Nuxt or Next.js site readable by AI: llms.txt, robots.txt, Markdown"
slug: ai-readable-site
language: en
category: Guide
publishedAt: 2026-11-23
coverText: "llms.txt"
excerpt: "Crawler rules by group, llms.txt as a table of contents, a Markdown URL per page and IndexNow on publish, with the reasons behind each choice."
---
Ask an AI assistant about a page on your site and one of three things happens. It answers from what it learned in training, it answers from a search index it built earlier, or it fetches your page right now. In all three, a crawler read your HTML at some point. What it was allowed to read, and how easily, is the part you can shape.

I built four pieces for that into the SEO plugin of Easy CMS, my embedded CMS for Nuxt and Next.js ([the first post in this series](FIRST_POST_URL) introduces it). The ideas work in any server-rendered site:

1. `robots.txt` rules for AI crawlers, by what they do.
2. `/llms.txt`, a short Markdown index of the site, and `/llms-full.txt`, the whole site in one file.
3. A Markdown URL for each page, such as `/posts/hello.md`.
4. IndexNow pings when a page changes for visitors.

First, render on the server. AI crawlers generally don't run JavaScript, so a page that loads its content in the browser looks empty to them.

## robots.txt: three kinds of AI crawler

"AI crawler" covers three jobs:

| Group | What it does | If you block it |
|---|---|---|
| `training` | Collects text to train models. | Your text stays out of future training sets. |
| `search` | Indexes pages for AI search and for answers that cite and link them. | Your pages stop showing up as cited sources. |
| `user` | Opens a page because a person asked an assistant to read it. | Assistants can't fetch your page on request. Some vendors say these may not always follow robots.txt. |

![Training crawlers are disallowed while search and user crawlers are allowed, and the site offers robots.txt, llms.txt, a Markdown version of each page and IndexNow](/images/blog/ai-readable-site/diagram-1.png)

Each company publishes its own user-agent names, and they change, so don't copy a list from a blog post. Easy CMS keeps them in one exported constant, `AI_CRAWLERS`, grouped as above and updated in each release. The [AI search guide](/docs/ai-search) shows the current list.

A common choice: stay out of training, stay visible in AI answers.

```ts
// app/robots.txt/route.ts (Next.js)
import { robotsTxt } from '@easy-cms/plugin-seo'
import config from '@/easy-cms.config'

export function GET() {
  // AI training crawlers stay out; AI search and assistants may still read and cite posts.
  const text = robotsTxt({ config, ai: { training: false } })
  return new Response(text, { headers: { 'content-type': 'text/plain; charset=utf-8' } })
}
```

The output, shortened:

```txt
User-agent: *
Allow: /api/cms/media/file/
Disallow: /admin/
Disallow: /api/cms/

User-agent: <one line for each crawler in the training group>
…
Disallow: /

Sitemap: https://example.com/sitemap.xml
```

Two choices need explaining.

**Everything is allowed by default.** If an upgrade started blocking a group, sites would quietly drop out of AI answers. Blocking is the site owner's business decision, so it's opt-in.

**Each group repeats the base rules.** A crawler follows only the most specific group that names it, without merging in `User-agent: *`. Add a group for one bot to disallow `/search`, and that bot may now crawl your admin and API. `robotsTxt()` adds the admin and API rules to every group it writes, including the ones you add with `rules: [{ userAgent: 'SomeBot', disallow: ['/'] }]`. If you write robots.txt by hand, copy your base rules into each group.

## llms.txt: a table of contents, not a dump

[llms.txt](https://llmstxt.org) is a proposed standard: a Markdown file at the root that says what the site is and where its main pages are. Here's what Easy CMS generates:

```md
# My Blog

> A blog about building websites in Thailand.

## Posts

- [Hello](https://example.com/posts/hello.md): What this blog is about.

## Pages

- [My Blog](https://example.com/)
```

You configure it in the plugin and serve it from a route:

```ts
// easy-cms.config.ts (excerpt)
seoPlugin({
  collections: ['posts'],
  generateURL: ({ doc }) => `/posts/${doc.slug}`,
  llms: {
    description: 'A blog about building websites in Thailand.',
    limit: 100, // newest pages per collection (the default)
    markdownURL: ({ doc, collection }) =>
      collection === 'posts' && doc.slug ? `/posts/${doc.slug}.md` : null,
  },
})
```

```ts
// server/routes/llms.txt.ts (Nuxt)
import { llmsTxt } from '@easy-cms/plugin-seo'

export default defineEventHandler(async (event) => {
  setHeader(event, 'content-type', 'text/markdown; charset=utf-8')
  return llmsTxt(await useEasyCMS())
})
```

Links are made absolute from a `{ siteURL }` you pass, or else from `admin.siteURL` in the config, or `serverURL` when `admin.siteURL` is empty.

The choices behind it:

- **Same pages as the sitemap.** Both share one function that reads documents without a login and drops anything marked "Hide from search engines", so the two files can't disagree.
- **100 newest per collection.** llms.txt is the contents page of a book. A list of every URL is the sitemap's job.
- **One locale.** llms.txt has nothing like `hreflang`, so every language would just repeat each page. It uses the default locale, or `llms.locale`.
- **A separate `markdownURL`.** `generateURL` stays the address of the HTML page, because the sitemap and the search preview depend on it.

`/llms-full.txt` (`llmsFullTxt(cms)`) is for tools that want the whole site in one request: every page's Markdown, newest first. It stops at about 5 MB (`maxBytes`) and ends with a line pointing to `/llms.txt` and `/sitemap.xml` for the rest.

## A Markdown URL for each page

HTML wraps the text in navigation, footers and scripts. Markdown is just the text. `docMarkdown()` writes one document as Markdown: title, description, URL, published and updated dates, then the body.

The body is rich text and `textarea` fields at the top level, plus any text inside blocks and arrays. Top-level `text` fields are skipped: they're usually a slug or a name, not content. If that guess is wrong for a collection, pass your own function in the plugin's `markdown` option.

In Next.js, a dynamic segment can't carry a `.md` suffix, so a rewrite maps the URL onto a route:

```ts
// next.config.ts
rewrites: async () => [{ source: '/posts/:slug.md', destination: '/md/posts/:slug' }],
```

```ts
// app/md/posts/[slug]/route.ts
import { getEasyCMS } from '@easy-cms/next'
import { docMarkdown } from '@easy-cms/plugin-seo'
import config from '@/easy-cms.config'

export const dynamic = 'force-dynamic'

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const cms = await getEasyCMS(config)
  // Read as a visitor: published posts only.
  const { docs } = await cms.find('posts', {
    where: { slug: { equals: decodeURIComponent(slug) } },
    limit: 1,
    overrideAccess: false,
    user: null,
  })
  const post = docs[0]
  if (!post || post.meta.noindex) return new Response('Not found', { status: 404 })
  // The address on the site from the config (admin.siteURL), not from the request's Host.
  const url = `${cms.config.admin.siteURL.replace(/\/+$/, '')}/posts/${post.slug}`
  return new Response(docMarkdown(cms, { collection: 'posts', doc: post, url }), {
    headers: { 'content-type': 'text/markdown; charset=utf-8' },
  })
}
```

In Nuxt, a server middleware matches `/^\/posts\/([^/]+)\.md$/` and does the same. Three details matter: read with `overrideAccess: false, user: null`, so only what a visitor may see comes out. Respect `noindex`: a page you hid from search shouldn't reappear as Markdown. And take the address from the config, not the request: a client can send any `Host` header, and a cached response would pass that address on to every reader.

**Why not `Accept: text/markdown` on the normal URL?** One URL with two formats looks cleaner, but many caches key on the URL alone. Unless every layer between you and the reader honors `Vary: Accept`, the first Markdown response gets cached and served to the next browser, or the reverse. A separate `.md` URL can't be mixed up.

## IndexNow: tell search engines when a page changes

Crawlers come back on their own schedule. [IndexNow](https://www.indexnow.org) lets you tell Bing, Yandex and the other engines that take part about a changed URL right away. Bing's index also feeds ChatGPT search and Copilot, which is why I put it in this plugin.

```ts
seoPlugin({
  // …
  indexNow: { key: process.env.INDEXNOW_KEY }, // 8–128 letters, digits or dashes, e.g. a UUID
})
```

Each part of the behavior has a reason:

- **Only changes visitors can see.** Publish, edit while published, unpublish, delete. A draft saved over a published post doesn't ping, because the live page hasn't changed. This was harder than it sounds: when a draft is waiting, the `previousDoc` that `afterChange` hooks get is that draft. So the plugin reads the published state in `beforeChange` and compares after the save. That costs one extra read per edit, and only when IndexNow is on.
- **Batched.** Changes are gathered for 5 seconds (`delay`), then sent as one request per host, up to 10,000 URLs each. Publishing 40 posts in one go means one request, not 40.
- **No retries.** A failed send is logged and dropped. Search engines still crawl as usual, so a lost ping costs little.
- **Public `https` URLs only.** `localhost`, IP addresses, hostnames without a dot, and `.test`, `.local`, `.example`, `.invalid` and `.internal` domains are skipped. Dev servers and test runs stay quiet with no config. A staging site on a real public domain *will* send, so leave `INDEXNOW_KEY` unset there.

IndexNow checks ownership with a key file at `/<key>.txt`, and accepts only URLs under that file's location, so it must sit at the root. The examples answer it with `indexNowKeyFile(cms, pathname)`: a catch-all `app/[file]/route.ts` in Next.js, a middleware in Nuxt. A plain file in `public/` works too.

One trade-off I accepted: the 5-second queue lives in memory. On serverless, if the function stops before it flushes, those URLs are lost. Set a shorter `delay` there.

## Doing this without Easy CMS

| Piece | What to do | The trap |
|---|---|---|
| robots.txt | One group per crawler category; the names come from each vendor's docs. | A named group ignores `*`, so repeat your base rules in it. |
| llms.txt | Title, one-line summary, newest pages per section, one locale. | Listing every URL and every language. |
| Markdown pages | A separate `.md` URL, read as an anonymous visitor. | Content negotiation behind a cache; leaking drafts or noindex pages. |
| IndexNow | Ping on visitor-visible changes, batched, public https only. | Pinging on every draft save, or from staging. |

## What I don't know yet

llms.txt is a proposal, not a standard every assistant reads. I can't tell you which ones use it today, or whether any of this changes where you rank. What I can say: each file costs one route, and none exposes anything a visitor couldn't already read.

[TODO: your story — one line on what you saw (e.g. which crawlers fetched /llms.txt or .md pages) after turning this on for a real site, or delete this line]

If you want the reference, the [AI search guide](/docs/ai-search) has the Nuxt and Next.js versions of every route, and `examples/next-blog` and `examples/nuxt-blog` in the repository run them all.

---

Easy CMS is MIT-licensed: [github.com/maritonx/easy-cms](https://github.com/maritonx/easy-cms) · [docs](/docs). If you try it, tell me what got in your way in the [feedback issue](https://github.com/maritonx/easy-cms/issues/137).

*I drafted this post with Claude, working from the project's design docs and git history. The decisions, and the mistakes, are mine.*
