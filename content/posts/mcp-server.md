---
title: "An MCP server for a CMS: AI agents working under the same roles as people"
slug: mcp-server
language: en
category: Guide
publishedAt: 2027-04-19
coverText: "MCP"
excerpt: "Easy CMS has an MCP server (still a preview) that gives Claude, Cursor or VS Code one tool per collection and action, only where an API key allows. Drafts stay drafts, every change is in a signed audit log, and a person still has to publish."
---
The interesting question about AI and a CMS isn't "can an agent write a blog post?" It obviously can. The question is what happens on the day it writes the wrong one, publishes it, or deletes something it shouldn't have touched.

Easy CMS has had an MCP server since 28 September 2026, as `@easy-cms/plugin-mcp`. This post is about how it is built around that question: an agent connects with an API key, the key belongs to a person, and the agent never gets more than that person's role allows. It also covers what an agent can't do, where its changes are recorded, and what is not built yet.

One thing first, and it matters: **the MCP plugin is experimental.** It shares the version number of the rest of Easy CMS (1.48.0 as I write this, on 14 November 2026), but its options, endpoint and tools may still change in a minor release. It is not covered by the stability promise that the rest of 1.x has. I'll come back to what it takes to change that.

## Setting it up

MCP (Model Context Protocol) is the protocol assistants such as Claude Code, Claude Desktop, Cursor and VS Code use to call tools on a server. Turning the CMS into one is a plugin and one config flag:

```ts
import { mcpPlugin } from '@easy-cms/plugin-mcp'

export default defineConfig({
  // …
  apiKeys: true,
  plugins: [mcpPlugin()],
})
```

The server is at `<routes.api>/mcp`, so usually `https://example.com/api/cms/mcp`. Then an admin creates an API key for the assistant under **Settings → API keys** and connects it, for example from Claude Code:

```bash
claude mcp add --transport http easy-cms https://example.com/api/cms/mcp \
  --header "Authorization: Bearer ecms_…"
```

The [MCP guide](/docs/mcp) has the same for Cursor, VS Code and Claude Desktop.

Two early decisions shaped the rest. The server uses the official SDK's Streamable HTTP transport **without sessions**: every request builds a new server, answers in plain JSON and closes. Nothing is kept between requests, so it runs on serverless hosts the same way it runs on a long-lived Node.js process. And it accepts **only an API key**. A request without one gets a `401` that says how to send one. A session cookie from the admin doesn't work, on purpose: a person's login should never be what an agent runs on.

## A key is a person, made smaller

API keys in Easy CMS were designed in the same decision record as the MCP server ([ADR-0019](https://github.com/maritonx/easy-cms/blob/main/docs/adr/0019-api-keys-and-mcp.md)), because they solve the same problem: something that isn't a person needs to act, and it shouldn't use a person's password.

The rule is short. **A key belongs to a user and never does more than that user may.** On top of that, the key lists what it may do, per collection and global: read, create, update, delete, publish. Both have to say yes:

- The key doesn't list the action: `403 This API key may not create "posts"`.
- The key lists it, but the owner's [access rules](/docs/access-control) don't allow it: `403 Forbidden`.

So an editor's key with "delete" ticked still can't delete what editors can't. Anything not ticked is not allowed, including collections added after the key was made.

A key for a writing assistant can be made in the admin or from a seed script:

```ts
const { key } = await cms.createApiKey({
  name: 'Claude',
  user: editor.id,
  permissions: {
    collections: { posts: ['read', 'create', 'update'], media: ['read', 'create'] },
  },
  expiresAt: '2027-03-01T00:00:00Z',
})
```

The key is returned once; Easy CMS stores only its SHA-256 hash. Deleting the key, or deactivating its owner, cuts the assistant off on the next request.

Your own access rules can also tell a key from a person, because a request made with a key has `user.apiKey` set:

```ts
access: {
  // People may delete posts; keys may not, whatever they list.
  delete: ({ user }) => !!user && !user.apiKey,
}
```

## The tools come from the key

This is the part I like most about the design. The server doesn't offer a fixed set of tools and then refuse most calls. It builds the tool list **from the key, on every request**: one tool per collection and action that the key allows.

With the key above, and a `posts` collection with drafts, the assistant sees exactly seven tools:

- `find_posts`, `get_posts`, `create_posts`, `update_posts`
- `find_media`, `get_media`, `upload_media`

There is no `publish_posts` and no `delete_posts` in the list, so the model never sees them and has nothing to try. The full set, for a key that allows everything, is:

| Tool | Needs |
|---|---|
| `find_<collection>`, `get_<collection>` | read |
| `create_<collection>`, `update_<collection>` | create, update |
| `delete_<collection>` | delete |
| `publish_<collection>`, `unpublish_<collection>` | publish (collections with drafts) |
| `schedule_<collection>` | publish (collections with `schedule`) |
| `upload_media` | create on Media |
| `get_global_<slug>`, `update_global_<slug>`, `publish_global_<slug>` | read, update, publish |

Each tool's input schema is generated from the collection's fields: a `select` becomes an `enum`, a `number` keeps its `min` and `max`, an upload field asks for media ids and points to `upload_media`. A model given a precise schema makes fewer wrong calls, and when it does, the error comes back as something it can act on, such as `Invalid data: title: is required`, instead of a stack trace.

The list is only the first gate. Every call goes through the Local API with `overrideAccess: false` and the key's user, the same path the REST API takes. Field-level access applies too: a field the owner may not read is simply missing from what `get_` returns, and the test suite checks that.

## Drafts stay drafts

The rule that matters most here: **in a collection with drafts, an agent's create and update always save a draft.** If the model sends `status: 'published'` in the data, the plugin removes it and saves `status: 'draft'`. Only `publish_<collection>` puts a document live, and that needs the publish permission on the key.

The built-in instructions the server sends to every assistant say the same thing in plain words, including "ask before publishing unless you were told to". You can add your own with the `instructions` option, for example a house style. But I don't rely on instructions for safety. A model can ignore them; it can't call a tool that isn't in its list.

This is also where I got something wrong. The description of `update_` told the assistant that "the live version stays" while it edits a published post. That is true when the collection has `versions`. Without versions, saving a published document as a draft takes it off the site until it is published again, the same as in the admin. So an agent told "the live page is safe" could take a page down. It was fixed in 0.68.1 on 16 October 2026: the description now depends on the collection, and says plainly when an edit takes a page offline. If you give an agent update without publish, turn on `versions` for that collection.

## What an agent can't do

Whatever a key says:

- **Users and API keys are never offered.** Those two collections are skipped when the tools are built, and a key can't create keys. An agent can't give itself more rights.
- **No schema or config tools.** The content model is TypeScript in your repository. An agent can change content, not the shape of it.
- **No fetching URLs.** `upload_media` takes the file as base64. A server that downloads whatever address an agent hands it is a server that can be pointed at your internal network, so it doesn't.
- **At most 100 documents per call.** Lists include drafts, as reading with a key always does.
- **Nothing outside the key's collections and globals.** The `collections` and `globals` options narrow it further for the whole server, for example to `['posts', 'categories', 'media']`.

And everything it does write goes through the same validation, hooks and versions as a save in the admin. There is no second, "AI" path into the database.

## The audit trail

If you turn on the [audit log](/docs/audit-log) (`audit: true`), every change an agent makes is recorded the same way a person's is: which document, which fields, the values before and after. The entry names the key's owner, says the change came through an API key, and keeps the key's name. "Claude" in the key's name is what you'll see next to the edit.

Entries can't be edited or deleted through Easy CMS, and each one is signed with HMAC-SHA256 using your `EASY_CMS_SECRET` ([ADR-0039](https://github.com/maritonx/easy-cms/blob/main/docs/adr/0039-audit-log.md)). An entry changed in the database afterwards no longer verifies, and a daily check reports it on the dashboard. The limits are written down too: someone who also has the secret can forge a signature, and reads are not recorded. That second one matters for agents: the audit log tells you what an agent changed, not what it looked at.

![How an MCP call flows: the agent connects with an API key, gets tools only for what the key and its owner allow, saves drafts through the same validation and hooks as the admin, every change goes into the signed audit log, and a person publishes; approving agent changes inside Easy CMS is not built yet](/images/blog/mcp-server/diagram-1.png)

## How it was tested

Calling the tool functions directly doesn't show how a real client talks to the server. Before 1.0, two issues on the roadmap made the plugin talk to real clients:

- **#115:** every tool called through the client of `@modelcontextprotocol/sdk`, plus clients on the protocol versions 2024-11-05, 2025-03-26 and 2025-06-18. That is in CI on every pull request now.
- **#121:** Claude Desktop and Claude Code connected by following the guide, reading, drafting and publishing. Claude Desktop needs `mcp-remote` to send a header, and it taught me one thing that went into the docs: if you edit `claude_desktop_config.json` while Claude is running, your change can be written over and the server just doesn't appear. Quit Claude first.

## What is missing

The honest list, as of 1.48.0:

- **It is still a preview.** The plugin leaves experimental in a minor release once three things hold: it is tested against a real client with the result written down in an issue, it has gone three minor releases in a row without a breaking change, and CI covers every option the docs list. Until then, read the changelog before you upgrade it.
- **No approval step.** Today the safety is "drafts plus a key without publish": the agent drafts, and a person opens the admin, reads the draft and publishes it. That works, but Easy CMS doesn't know the draft is a proposal. There is no queue of agent changes, no approve or reject, and the audit log can't record who said yes to whom. Changes by an agent that wait for a person to approve them are a level 6 item on the [roadmap](/roadmap), not built yet. I wrote about why that is the summit of the whole roadmap in [Easy CMS is not just a CMS](/blog/more-than-a-cms).
- **No stdio and no OAuth.** It's HTTP with a Bearer header only. Clients that can't send a header need `mcp-remote` in between. A local `easy-cms mcp` over stdio and OAuth are on the later list, without dates.
- **No uploads from a URL**, by design for now, as above.

## Try it

If you have an Easy CMS project, start with the [MCP guide](/docs/mcp). Give the key read, create and update on one collection, turn on `versions` and the audit log, and let an agent draft something you then review in the admin.

If you connect it to a client I haven't tried, or you have an opinion on how approving agent changes should work, I'd like to hear it in [GitHub discussions](https://github.com/maritonx/easy-cms/discussions). That design hasn't been written yet.
