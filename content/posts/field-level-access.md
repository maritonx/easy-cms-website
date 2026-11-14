---
title: "Roles down to single fields, row-level access, and API keys that never outrank their user"
slug: field-level-access
language: en
category: Guide
publishedAt: 2027-03-22
coverText: "access.read"
excerpt: "How Easy CMS decides who may do what. Access rules in TypeScript that return a where, roles ticked in the admin, owners and a Mine filter, and API keys that are always narrower than their user, checked in one place for every way in."
---
Easy CMS started as a headless CMS inside a Nuxt or Next.js app, and it is turning into a whole TypeScript backend ([I wrote about that climb here](/blog/more-than-a-cms)). The part of a backend that matters most, and that is easiest to get wrong, is the rules about who may do what.

This post is about those rules in Easy CMS 1.48.0: access rules in code that can return a query instead of a yes or no, roles that admins tick in the admin down to a single field, documents that have an owner, and API keys. It is also about the one decision that holds them together: every way into the data goes through the same check.

## Layer 1: access rules in code

Everything starts in the config, as functions:

```ts
import { defineConfig, isAdmin, isStaff } from '@easy-cms/core'

export default defineConfig({
  collections: [
    {
      slug: 'posts',
      drafts: true,
      access: {
        // Visitors see published posts; signed-in users see everything.
        read: ({ user }) => (user ? true : { status: { equals: 'published' } }),
        create: isStaff,
        // Admins edit every post, other users only their own.
        update: ({ user }) => (user?.role === 'admin' ? true : user ? { author: { equals: user.id } } : false),
        delete: isAdmin,
      },
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'author', type: 'relationship', to: 'users' },
        { name: 'featured', type: 'boolean', access: { update: ({ user }) => user?.role === 'admin' } },
      ],
    },
  ],
})
```

A rule gets `{ user, id?, data? }` and returns either `true`/`false` or a **where query**. That second form is row-level access. For `read`, the where is added to every query, so a visitor's list of posts is filtered in the database, not after it. For `update` and `delete`, the document must match it. `create` has to return a boolean, because there is no document yet to match.

Two details here came from thinking about what an id can tell an attacker. Updating or deleting a document you may not even read answers `404`, exactly like an id that doesn't exist. A document you may read but not change answers `403`. So probing ids tells you nothing about what exists.

The other detail is the default. If a collection has no rule for an operation, only signed-in users of the admin are allowed. Public content has to be made public on purpose, with `read: () => true` or the `anyone` helper. I would rather someone ask "why can't visitors see this?" than find out their drafts were public.

### Fields

Fields take their own `read`, `create` and `update` rules. A field the user can't read is left out of responses and out of the admin. A field they can't update is ignored in input and shown read-only. `create` decides who may set a field when a document is created, and falls back to `update`, so "anyone fills this in once, only admins change it later" is two lines.

Unlike collection rules, a field rule is a plain yes or no. The checker in `access-control.ts` only treats an exact `true` as allowed, so returning a where from a field rule denies.

This is also where I found my own hole. Until 0.34, `access.read` on a field only hid the value from responses. You could still filter by that field. Say a `salary` field you couldn't read: `?where[salary][gt]=100000` would still answer with a shorter list, and a few of those requests give the value away. Now a field you can't read can't be used to filter or sort either: the request answers `403`. That applies to field rules in code and to fields hidden by a role. It did break filters some projects had been running, which [ADR-0037](https://github.com/maritonx/easy-cms/blob/main/docs/adr/0037-own-documents-and-field-permissions.md) lists as a consequence. I think that was the right trade.

## Layer 2: roles in the admin

Rules in code are good for things that are true of the product: "visitors see published posts". They are bad for things that are true of a team this month: "the translators may edit pages but not delete them". Changing those shouldn't need a deploy.

So since 0.33, one line turns on roles:

```ts
auth: { roles: ['admin', 'editor', 'author'], rbac: true },
```

Admins then get **Settings → Roles**. They add roles, copy one to start from, and tick **Read, Create, Update, Delete** and **Publish** for each collection and global, and which admin pages each role sees (the system status, Deliveries, Jobs, plugin pages and dashboard panels). Backups, Email and Roles stay with admins: a backup holds the whole database, and the Email page sends mail from the site.

The decision that shaped everything else: **a user may do something only when both the code and the role allow it.** The code stays the ceiling. A role can narrow what your access rules allow, never widen it. So "authors edit their own posts" in code keeps working whatever an admin ticks, and nobody can tick their way past a rule a developer wrote.

A few rules follow from that:

- Admins (`role: 'admin'`) may always do everything, and that role can't be edited or deleted.
- Visitors who aren't signed in are left to access rules alone, so `read: () => true` stays public.
- Everyone keeps their own account page, whatever their role.
- The roles listed in `auth.roles` can be renamed and re-ticked but not deleted, because your code may compare `user.role === 'editor'`.

The trade-off I spent the longest on was what a new collection means. When roles are first turned on, every existing role gets everything it could do before, so turning roles on changes nothing until someone unticks a box. But a collection added to the config later is given to **no** role. Only admins see it until someone ticks it, and Settings → Roles marks it **New**. That annoys people: you deploy a collection and your editors can't see it. The other choice was a collection holding sensitive data showing up for every editor on deploy, and I didn't want to make that one.

Roles are cached in memory. A change clears the cache on the instance that made it; other instances read roles again at least every 30 seconds. With several servers, an unticked box can take up to half a minute to apply everywhere.

### Down to single fields

**Fields ›** on a role's row opens that collection's fields, each one **Can edit**, **Read only** or **Hidden** for the role. Fields you don't set follow the row, so a field added later behaves like the rest. Hidden fields aren't sent and can't be filtered or sorted by, for the same reason as above. Read-only fields are shown but not saved from requests.

One guard: a required field with no default can't be made read-only or hidden for a role that may create documents. Otherwise that role could never create one.

## Documents that have an owner

The most common rule I was asked for wasn't per field. It was "writers can read every post, but change only their own". With roles on, that is a toggle: next to a ticked Read, Update, Delete or Publish, a person button limits it to the role's **own documents**.

That needed Easy CMS to know who owns a document, which it didn't. Versions recorded who saved what, but only for collections with versions. So with roles on, every collection except Users gets a `createdBy` field. Easy CMS sets it when a document is created, requests can't set or change it, and trusted Local API calls can, so imports keep their real authors.

Often the owner is a field you already have, like a post's author:

```ts
{
  slug: 'posts',
  admin: { ownerField: 'author' }, // a relationship to users, not hasMany
  fields: [{ name: 'author', type: 'relationship', to: 'users' } /* … */],
}
```

An empty owner field is filled with whoever creates the document. A role limited to its own documents gets that field as read-only, so it can't give a document away or take someone else's. Under the hood, "own documents only" is the same thing as layer 1: a where, `{ author: { equals: user.id } }`, added by the role instead of by your code.

Lists in the admin get a **Mine** filter. Deleting a user asks who gets what they own, or nobody (`DELETE <api>/users/:id?transferTo=<id>` over REST). Documents from before roles get `createdBy` from whoever saved their first version, where there is a history; the rest have no owner, so only roles with all documents can change them.

## API keys that never outrank their user

Scripts, other apps and AI agents shouldn't use someone's password. They get an API key (`apiKeys: true`, then **Settings → API keys**).

I have called these "API keys under a role" before, including in my last post. That is close, but not quite how they work, so I'll be exact here. A key has no role of its own. **A key belongs to a user, and it is always narrower than that user.** It lists what it may do per collection and global (read, create, update, delete, publish), and on every request Easy CMS checks the key's list *and* the owner's access rules *and*, with roles on, the owner's role. If the owner's role loses Delete next week, every key they made loses it too, without anyone editing the key. The admin only offers to tick what the owner may do.

The answers tell a script which part said no:

| Answer | When |
|---|---|
| `401 Invalid or expired API key` | Wrong, deleted or expired key, or its owner is deactivated |
| `403 This API key may not create "posts"` | The key doesn't list that action |
| `403 Forbidden` | The key lists it, but the owner's rules don't allow it |

A bad key gets `401` rather than quietly being treated as a visitor, so a script with a revoked key fails loudly instead of reading only public content.

Some things no key can do, whatever it lists: read or change users, read or change keys, or create a key. A key with create and update but not publish writes drafts that a person reviews and publishes. And your own rules can tell keys apart, because the request's user has `apiKey` set:

```ts
access: {
  // People may delete posts; keys may not, whatever they list.
  delete: ({ user }) => !!user && !user.apiKey,
}
```

What went wrong here was smaller but real. Keys keep working when a password changes, which is what you want for a script. But after someone resets a forgotten password, whoever had the old password may have made a key. So the admin now shows your keys first after a reset and offers to revoke them, and the Account page has **Revoke all**.

## One check, every way in

None of the above would be worth much if each way into the data checked it differently. So there is one place. The Local API runs the access rules, the role and the key's permissions together, and every other way in calls the Local API as the user.

![Every way in, the admin, REST, the Local API with overrideAccess false, the realtime stream and MCP, goes through one check of API key, role and access rules, which returns a where for rows, a list of fields to strip, or 404 and 403](/images/blog/field-level-access/diagram-1.png)

- **The admin** has no back door. It is a client of the REST API, so it gets exactly what REST gives that user. Hiding buttons a role can't use is a convenience; the server decides.
- **REST** passes the signed-in user, or the key's owner with the key, on every call.
- **The Local API** trusts its caller by default: it is your server code. To run it as a user, pass them: `cms.find('posts', { user, overrideAccess: false })`. This is the one place where the rules are opt-in, and I go back and forth on it. Server code that seeds data or runs jobs needs to do everything, and making every such call pass a flag would be noisy. But forgetting `overrideAccess: false` in a route that serves a user is an easy mistake, and only code review catches it.
- **Realtime** (since 1.47.0) sends each subscriber the document as they would read it over REST: row-level where, field read rules, key permissions and drafts apply to each subscriber on their own. A `where` on a field they can't read gets `403` when the stream opens, as a list would. When a session ends or a key is revoked, the stream closes within a minute. And `leave` and `delete` events go only to subscribers who could see the document before the change, so nobody learns the id of a post they were never allowed to read. That check runs in memory, and when it can't tell (a `like`, a value in an array) it sends nothing. The cost is that a client may keep such a document until it loads the list again. I chose stale over leaky.
- **MCP** (the plugin is still experimental) only accepts an API key. Its tools are generated from what the key allows, and on collections with drafts `create_` and `update_` always save a draft. Only `publish_` makes something live, and only if the key and the owner may publish.

The integration tests for this (`access.test.ts`, `roles.test.ts`, `owners.test.ts`, `api-keys.test.ts`) run on SQLite, PGlite and a real Postgres 17 in CI on every pull request.

## What's still missing

- **One role per user.** A translator who is also a reviewer needs a role made for that combination.
- **Field permissions are top-level only.** Fields inside groups, arrays and blocks follow their parent. You can hide a whole `pricing` group from a role, not one field inside it, unless you write a field rule in code.
- **No bulk change of owners.** Moving a hundred posts from one author to another happens when you delete the user, or with a script.
- **The Local API's default** stays trusted, as above. A lint rule or a typed "as user" client might help; neither exists yet.
- **Approvals.** An agent with a key can draft but not publish, which is a start. A real step where a person approves an agent's change, recorded in the audit log, is on the roadmap and not built.

## Try it

Roles, owners and field permissions are in the MIT release, with `auth: { rbac: true }` and a migration (`npx easy-cms migrate:create roles`). The guides go further: [Access control](/docs/access-control), [Roles from the admin](/docs/roles) and [API keys](/docs/api-keys).

If your team has a rule that doesn't fit any of these layers, I'd like to hear it in [GitHub discussions](https://github.com/maritonx/easy-cms/discussions). The missing pieces above get built in the order people need them.
