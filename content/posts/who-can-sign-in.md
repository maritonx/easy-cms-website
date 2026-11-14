---
title: "Letting admins decide who signs in, without locking themselves out"
slug: who-can-sign-in
language: en
category: Engineering
publishedAt: 2027-03-15
coverText: "break-glass"
excerpt: "Easy CMS 1.46 moved \"who uses a password\" and \"who signs themselves up\" from the config into the admin. The hard part was the guard rails, a preview of who is affected, refusing changes that would lock every admin out, and a way back when it happens anyway."
---
Since 1.43, admins of an Easy CMS site could turn sign-in providers on in the admin: Google, Microsoft, GitHub or any OpenID Connect provider, without a deploy. But two other questions stayed in the code. Who may still use a password? And who gets an account just by signing in with the company's Google or Microsoft account?

Those two are the ones that hurt when they are wrong. Set them too tight and the organization locks itself out of its own CMS. Set them too loose and strangers sign themselves up. 1.46.0, released on 13 November 2026, moved both into **Settings → Single sign-on** anyway. This post is about the guard rails that made me comfortable doing it, and the gaps that are still there.

## The rules in code

Before 1.46 the rules lived in `easy-cms.config.ts`, and they still can:

```ts
import { microsoft } from '@easy-cms/auth-oauth'

export default defineConfig({
  serverURL: 'https://cms.example.com',
  auth: {
    providers: [microsoft()],
    // who uses a password: true (everyone), false (only admins) or break-glass accounts
    password: { breakGlass: ['emergency@example.com'] },
    // who gets an account the first time they sign in with a provider
    providerSignUp: { domains: ['example.com'], role: 'editor' },
  },
  // …
})
```

`password` has three settings. `true` lets everyone sign in either way. `false` makes everyone use the provider except admins, who keep a password as a way in when the provider is down. `{ breakGlass: [...] }` is for organizations that require MFA at their identity provider and want no account, admins included, to get around it with a password. Only the listed accounts keep one, for emergencies.

That works well for a developer. It doesn't work for the person who actually runs sign-in at most organizations, who isn't the one deploying the CMS. Asking a developer to redeploy so an IT admin can change who uses a password is the kind of thing [ADR-0066](https://github.com/maritonx/easy-cms/blob/main/docs/adr/0066-admin-overrides-code-defaults.md) set out to remove: the code sets the default, and an admin can change it.

## The code stays the default

[ADR-0068](https://github.com/maritonx/easy-cms/blob/main/docs/adr/0068-sign-in-rules-in-admin.md) applies the same pattern to these two rules:

- **The admin's value wins over the code's.** Each rule in the panel says whether it comes from the code or was changed there.
- **Saving the code's value keeps nothing.** If an admin saves exactly what the config says, nothing is stored, so a later change in the code still takes effect.
- **"Use the code's value"** forgets the admin's change.
- **Only admins of the whole site** can change the rules, and an API key can't, even an admin's.
- **Every server follows within 30 seconds.** Each one reads the rules again after that long, so a change reaches all of them without a restart.
- **Every change is in the audit log** as `sign-in.rules`, with what it was before and after.

The panel lives in Settings → Single sign-on, where these rules were already shown read-only, not in Settings → Integrations, which is about connections. It is one page that answers "who can get in", and now it can also change the answer.

## Before saving: who does this affect?

A password policy is not a preference. When it changes, it takes effect at once: accounts that may no longer use a password lose it, and their sessions started with a password end. Sessions started with a provider stay. Without that, someone who signed in with a password yesterday would keep a session that the new rule says shouldn't exist.

That makes the save button dangerous, so the admin asks the server first. The same request with `?dryRun=1` runs every check and returns what the change would do, without doing it:

```json
{ "passwordLost": 1, "sessionsEnded": 1 }
```

If either number is above zero, the admin asks before saving: "1 account(s) will no longer sign in with a password, and 1 session(s) will end. Save?" Accounts without a password at all aren't counted as losing one, and sessions from before Easy CMS recorded how a session started are treated as password sessions, the safer guess.

## Refusing a change that locks people out

The preview tells you what will happen. The guard decides whether it may happen at all. Every change to the password policy is checked against two questions:

1. **Could any admin still sign in afterwards?** An active admin counts if the new policy lets them use their password, or if their account is linked to a provider that is on. If an admin could sign in before and none could after, saving is refused: "No admin could sign in after this: an admin needs a password or an account linked to a provider that is on".
2. **Could the admin saving it still sign in?** The same check, for the person pressing the button: "You couldn't sign in after this: link a provider on your account page first, or keep yourself on the break-glass list".

The second one is the one I nearly left out. The first guard stops the site from losing every admin. It doesn't stop the admin in front of the screen from cutting off their own access while a colleague keeps theirs. That still ends with a support request and a locked-out person. Both guards run on the server, so a crafted request gets the same answer as the button.

![Saving a sign-in rule in the admin: a dry run counts the accounts that lose their password and the sessions that end, the admin confirms, then the server refuses the change if no admin, or the admin saving, could sign in; otherwise it stores the rule, ends password sessions and writes the audit log, and every server follows within 30 seconds](/images/blog/who-can-sign-in/diagram-1.png)

## Break-glass accounts that can't disappear

In the config, break-glass accounts are emails. In the admin they are chosen from a list of active admins who have a password, and stored by user id, because an email can change. The list needs at least one admin, and each account must be active and have a password, or saving is refused with the reason (`… has no password`, `… is deactivated`).

Choosing them well is not enough, because they can be changed later from somewhere else. Imagine the provider is down for a day, and the only break-glass admin was demoted last week by someone tidying up the users list. So while the admin's break-glass list is in use, the last admin on it who can still sign in with a password is protected. They can't be deleted, deactivated, made something other than admin, or have their password taken away until another admin on the list has a password. The refusal says why: "is the last admin who can sign in with a password when the provider is down: add another break-glass account first".

The check sits in the Local API's update and delete, not in the admin's user page. It applies to the admin, to REST and to your own server code, even with `overrideAccess: true`.

## Sign-up by email domain, with fewer ways to get it wrong

The second rule is about new people. "Everyone with an `@example.com` address gets an account, as an editor, the first time they sign in with Google" saves a lot of invitations. It is also one typo away from letting in the whole internet.

So saving a sign-up rule refuses three things:

- **Domains anyone can get an address at.** `gmail.com`, `outlook.com`, `yahoo.com`, `icloud.com`, `proton.me` and others, 21 in a list in the core. "Everyone from gmail.com" means everyone. The message suggests inviting people instead.
- **The `admin` role.** Admins are made by an admin, in Settings → Users, never by signing themselves up.
- **Roles that can change other accounts.** With role-based access on, any role that may create, update or delete users is refused too. Someone who signed themselves up shouldn't be able to give others access. If every role can do that, the panel says so and links to Settings → Roles to make one that can't.

The domain list is deliberately short. It covers the usual mistakes, not every free email provider in the world, and it lives in the core instead of a dependency. If your organization's domain is a public one, the honest answer is invitations.

If no provider is on, the rule is accepted but has no effect, and the panel says "No effect now: no provider is on."

## The config doesn't get the same refusals, yet

Here is the inconsistency I chose to live with. The admin refuses a sign-up rule for `gmail.com` or for a role that manages users. The config's `auth.providerSignUp` with the same values is only warned about, in the server log at start and on the Single sign-on page.

Making it an error would break a site that upgrades from 1.45 with that config, and Easy CMS promises no breaking changes within 1.x. So it is a warning in 1.x, and the ADR records that it becomes an error in 2.0.

## When the code must win: auth.locked

Some teams don't want sign-in to be changeable from the admin at all, for audits or because sign-in is managed somewhere else. One option, already there since 1.43 for providers, covers the rules too:

```ts
auth: { providers: [microsoft()], locked: true }
```

With `auth.locked`, the panel shows the rules with "Set in the code (auth.locked): it can't be changed here", the server refuses changes, and anything an admin stored earlier is ignored.

## When it happens anyway: easy-cms reset-sign-in

The guards check what the database knows. They can't know that the Microsoft client secret expired this morning, or that the provider is having an outage. An admin "linked to a provider that is on" may still not be able to sign in.

For that, there's a command to run where the app runs:

```sh
npx easy-cms reset-sign-in
```

It forgets what admins changed, both the providers turned on or off in Integrations and the rules in Single sign-on, and goes back to what the config says. It prints what it changed, and the reset is in the audit log. It needs access to the server, not to the admin. That's deliberate: if you can't sign in, the admin is exactly what you don't have.

## What's still missing

- **"Use the code's value" has no preview.** The admin asks the server what a new password rule would do, but going back to the code's rule saves at once. The guards still apply, so it can't lock every admin out, but it can end sessions without saying how many first.
- **Nobody affected gets an email.** The login page, invitations and "forgot password" follow the policy, so people are told when they try. But there's no message that says "from today, sign in with Microsoft".
- **The config's break-glass emails aren't protected the same way.** The "last admin on the list" guard covers accounts chosen in the admin. For the config's list, the server log warns when none of the accounts exists with a password.
- **Site members are separate.** Sign-up for site visitors (`auth.members`) is not part of these rules.

## Try it

The [Single sign-on guide](/docs/sso#who-can-sign-in) has the panel, the config options and `reset-sign-in`. This is part of making Easy CMS a backend where the rules about who may do what live in one place ([the roadmap post](/blog/more-than-a-cms) has the bigger picture).

If you run sign-in for an organization and something here doesn't match how you work, or you've been locked out of a CMS in a way these guards wouldn't catch, tell me in [GitHub discussions](https://github.com/maritonx/easy-cms/discussions).
