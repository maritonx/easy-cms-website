---
title: "Easy CMS is not just a CMS: the climb to a backend people and AI agents share"
slug: more-than-a-cms
language: en
category: Engineering
publishedAt: 2026-11-14
coverText: "6 levels"
excerpt: "Easy CMS started as a headless CMS inside a Nuxt app. It is becoming a whole TypeScript backend, in six levels with a public roadmap, where a level only counts as done when CI tests it."
---
Easy CMS started with one idea: a headless CMS that lives inside your Nuxt or Next.js app. The content model is TypeScript in your repository, the admin is at `/admin`, and there is no second server to run. That is still true, and it is still the first thing most people use it for.

But by the 1.40s, I noticed the word "CMS" had stopped describing what you could build with it. It had sign-in and roles. Files on S3. A job queue that retries. A shop. Forms. Webhooks. An AI that writes alt text. Several sites in one install. That isn't a place to store blog posts any more. It is most of a backend.

So this post is about where Easy CMS is going, and how I keep that honest.

## One TypeScript file, a whole backend

The thing that made this possible was there from the first commit on 25 September 2026: everything starts from one TypeScript config.

```ts
export default defineConfig({
  collections: [
    {
      slug: 'orders',
      access: { read: ({ user }) => (user?.role === 'staff' ? true : { customer: { equals: user?.id } }) },
      realtime: true,
      fields: [
        { name: 'customer', type: 'relationship', to: 'users' },
        { name: 'total', type: 'number', access: { update: ({ user }) => user?.role === 'admin' } },
        { name: 'status', type: 'select', options: ['new', 'paid', 'shipped'] },
      ],
    },
  ],
})
```

From that file you get the database tables and their migrations, the types your queries return, a REST API and an admin, and one set of access rules that every way in respects. The rule above that a customer only reads their own orders applies to the admin, to REST, to the Local API in your server code, to an API key, to the realtime stream, and to an AI agent talking to the MCP server. You write it once.

That last part is the whole point. A backend is mostly rules about who may do what. If the rules live in one place, adding a new way in, whether a stream, an agent or a webhook, doesn't mean writing them again and hoping they match.

## Six levels

To say where Easy CMS is going without promising things that don't exist, I wrote it down as six levels, from what it was to where I want it to be. Each level lists what works today and what is still to build. The [roadmap page](/roadmap) shows the same lists, edited in the website's own Easy CMS admin.

![The six levels of the Easy CMS roadmap: levels 1 to 3 complete, level 4 being built next, levels 5 and 6 in progress, each with what works today and what is still to build](/images/blog/more-than-a-cms/diagram-1.png)

**1. Headless CMS. Complete.** Collections and globals, drafts and versions, scheduled publishing, Thai and English content with translation status, a media library, live preview, REST and GraphQL. This is where it started.

**2. Backend as a service. Complete.** SQLite, Turso and Postgres with committed migrations. Passwords, single sign-on and site members. Files on S3, Cloudflare R2 and Vercel Blob. Node.js, Bun, Deno and Cloudflare Workers, tested on every pull request. And since 1.47.0, realtime: your app subscribes to changes in a collection over Server-Sent Events, filtered by the same access rules. That was the last missing piece, and it closed the level.

**3. App framework. Complete.** The typed config and Local API, hooks and access rules in code, roles down to single fields, and actions that run your server code from a button in the admin, inside Next.js and Nuxt.

**4. Business engine. Building next.** A shop plugin (still a preview), many sites in one CMS, a form builder, saved views and a calendar view work today. A Kanban view and CRM and booking templates for `create-easy-cms` are what's next.

**5. Durable workflows. In progress.** A job queue in your own database, with retries, schedules and an outbox for webhooks and email. What's missing is workflows of many steps that can wait for days and pick up again after a crash.

**6. AI-native. In progress.** An AI plugin for Claude, GPT and Gemini with daily limits, an MCP server (preview), API keys that never do more than their user, and a signed audit log. Still to build: the MCP server out of preview, and changes made by an agent that wait for a person to approve them.

Three of six. That's where it is today, and the page says so.

## What "complete" means

The rule I hold myself to is short: a level is complete when what it needs has shipped and CI tests it on every pull request. Not when the code exists. Not when it works on my machine.

Level 2 is a good example, because it was the last one to become complete, in 1.47.0 in November 2026. Realtime was designed in the open first ([ADR-0070](https://github.com/maritonx/easy-cms/blob/main/docs/adr/0070-realtime.md)): one SSE connection carrying many subscriptions, an event table written in the same transaction as the save so nothing is announced that didn't happen, resume with `Last-Event-ID`, and filtering per subscriber. Then it was built. Then the tests: integration tests on SQLite and on real Postgres, a test with two instances of the CMS where a save on one must reach a subscriber on the other, an end-to-end test where a visitor's page follows an editor publishing in another window, and a smoke test on Cloudflare Workers.

The review also caught something before release. A subscriber filtering posts by category was told a post had "left" their view when it was edited, even if they had never been allowed to see it. That event carried the post's id, so it leaked that a hidden document existed. The fix sends `leave` and `delete` only to subscribers who could see the document before the change. Only after all of that did level 2 change from "building next" to "complete" on the roadmap.

The roadmap also leaves a few things out on purpose. There are no percentages, because "level 4 is 60% done" means nothing you can check. There are no dates for levels in progress, only the next piece or two. And it doesn't compare Easy CMS to anything; it says what Easy CMS does.

## The summit: people and agents under one set of rules

Level 6 is the reason for the climb, so it is worth saying exactly what I mean.

More and more of the changes to a site's content will be drafted by an AI agent: a product description, a translation, a fix to fifty broken links. The question isn't whether an agent can call an API. It can. The question is under what rules.

In Easy CMS, an agent connects to the MCP server with an API key. The key belongs to a user and never does more than that user's role may, and it can be narrowed further, to "read and create posts, nothing else". The agent goes through the same access rules, field by field, that a person goes through in the admin. Every change lands in the audit log, and the entries are signed, so one changed afterwards no longer verifies.

What's missing is the step in between. At the summit, an agent drafts a change, a person sees it and approves it, and the audit log records both: who proposed it and who said yes. That is the "agent changes that wait for a person to approve them" item on level 6, and it isn't built yet. When it is, the backend you wrote in one TypeScript file will be a place where people and agents work together, and neither gets around the rules.

## Why every level is MIT

Every level on the way up ships in the MIT release. There's no paid tier that the roadmap quietly leads to, and nothing marked "working today" needs a licence key. Easy CMS runs on your own infrastructure, on your own database.

I think that matters more for a backend than for a CMS. You put your users, your orders and your rules in it. You should be able to read all of it, run all of it and leave with all of it.

## Where to start

You don't need to wait for level 6. Everything above that says "complete" or "works today" is in the current release:

```bash
npm create easy-cms@latest
```

The [roadmap](/roadmap) shows each level and what is being built next, and each piece is designed in a GitHub issue before it is built. If something on the climb matters to you, or something you need isn't on it at all, tell me in [GitHub discussions](https://github.com/maritonx/easy-cms/discussions). That's how the next pieces get chosen.
