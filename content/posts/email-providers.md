---
title: "Email providers chosen in the admin: Resend, Postmark and Brevo over plain fetch"
slug: email-providers
language: en
category: Guide
publishedAt: 2027-03-29
coverText: "Resend · Postmark · Brevo"
excerpt: "How Easy CMS lets an admin switch the site's email from the code's default to Resend, Postmark, Brevo or SMTP, after a test email proves it works. Plain fetch instead of three SDKs, encrypted keys, delivery webhooks, a suppression list, and a log that keeps who and what subject, never the content."
---
Easy CMS has sent email since September 2026: forgotten-password links, invitations, form notifications, shop orders, and whatever your own code sends with `cms.sendEmail()`. For most of that time, how it sent was a line in the config:

```ts
email: smtp({ from: 'My Site <no-reply@example.com>' }),
```

That works for developers. Now picture whoever runs the site a year later, after the developers have moved on, on the day the SMTP password stops working. They can't change a config file. They can log in to the admin.

Since 1.42.0, they can do it there. An admin connects Resend, Postmark, Brevo or any SMTP server, sends a test email, and the site switches. This post is how that works, the decisions behind it, and what it still doesn't do.

## The code stays the default

The first decision came before any provider: who wins, the code or the admin?

Settings → Backups, in 1.41.0, had gone the other way: the code won, and the admin could see the settings but not change them. For email that felt wrong. The person with the expired password is the one who needs to fix it. So [ADR-0066](https://github.com/maritonx/easy-cms/blob/main/docs/adr/0066-admin-overrides-code-defaults.md) set an order for everything the admin can now override: **what the admin chose, then the code, then the system default.**

```ts
import { consoleEmail, defineConfig } from '@easy-cms/core'
import { smtp, smtpProvider } from '@easy-cms/email-smtp'
import { emailPlugin, emailProviders } from '@easy-cms/plugin-email'

export default defineConfig({
  // The default until an admin chooses a provider (optional).
  email: process.env.SMTP_HOST ? smtp() : consoleEmail(),
  plugins: [emailPlugin({ providers: [...emailProviders, smtpProvider] })],
})
```

Whatever `email` says is what the site uses until an admin picks something else, and **Use the code's** always goes back to it. In Settings → Integrations → Email the code's adapter shows as its own card, **From the code**, described as "the default when no provider here sends". With `consoleEmail()`, that card says `console`, which is honest: in development nothing leaves the server.

That honesty was a bug fix. Before 1.0.1, sending a test email from the admin with `consoleEmail()` said it was sent. It wasn't; it was printed to the server log. A live site that had forgotten its `SMTP_HOST` looked as if mail went out, until someone asked why no password links arrived. Now the test answers `{ "ok": true, "logged": true }`, the admin says **Not sent** and how to set up a real adapter, and a warning sits above the settings.

## Three providers, three fetches

`@easy-cms/plugin-email` adds Resend, Postmark and Brevo. It has no dependencies of its own: only `@easy-cms/core` as a peer. Each provider is a `fetch` to its HTTP API, in a file of 106 to 137 lines.

The reason is the same one I gave for [the AI providers](/blog/ai-in-the-admin). Easy CMS installs into your app, so its dependencies become your dependencies. A site that sends with Postmark shouldn't install Resend's and Brevo's SDKs too. And the part of each API a CMS needs is small: send one email and get its id back, check that a key works, and read a webhook.

Here is Resend's `send()`, trimmed (the real one leaves out empty `cc`, `bcc`, `html` and `text`):

```ts
const response = await fetch(`${api()}/emails`, {
  method: 'POST',
  headers: { authorization: `Bearer ${values.apiKey}`, 'content-type': 'application/json' },
  body: JSON.stringify({
    from: message.from,
    to: list(message.to),
    subject: message.subject,
    html: message.html,
    text: message.text,
  }),
})
const body = await json(response)
if (!response.ok) throw failure('Resend', response, body)
return typeof body.id === 'string' ? { id: body.id } : undefined
```

Throwing means the email is retried later, on the queue every Easy CMS email already goes through: after 1 minute, then 5 and 30 minutes, then 2, 6 and 12 hours, then marked failed in **Settings → Deliveries**. The returned `id` is new in 1.42.0. It is how a webhook, later, finds the email it is talking about.

The trade-off of plain `fetch` is that I maintain what an SDK would: each provider's field names, error shapes and webhook formats. Brevo wants people as `{ email, name }` objects, Postmark answers with `ErrorCode` and `Message`, Resend with `message`. What made it manageable is testing. Each provider's base URL can be pointed elsewhere (`RESEND_API_URL`, `POSTMARK_API_URL`, `BREVO_API_URL`), so the plugin's tests run against a small fake of all three APIs, and the end-to-end test drives the real admin against a mock Resend on its own port. That catches my mistakes, not changes on the provider's side, which is the risk I accepted.

Postmark, Brevo and Resend aren't the only providers people use. Any service with SMTP works through `smtpProvider`, and `defineEmailProvider()` from the plugin is the same function these three use, if you want to write a fourth.

## Connect, then prove it

In the admin, connecting a provider is a short form: the API key (or the SMTP host, user and password) and **Send as**, the sender. Under it: "an address on a domain verified with the provider".

That line is there because of the most common way this goes wrong. You paste a working key, set the sender to `hello@yoursite.com`, and the provider refuses every email because `yoursite.com` was never verified in its dashboard. The key check passes (Resend's checks the key by listing your domains), the form saves, and the site has quietly stopped sending.

So connecting doesn't switch anything. A second button does, **Send email with Resend**, and it sends a test email to the admin who pressed it, with that connection, that key and that sender. Only if the provider accepts it does the site switch. If the domain isn't verified, the provider says so, the admin sees "The test email to … wasn't sent, so nothing changed", and the code's default keeps sending.

A few rules sit around that:

- **Only admins of the whole site** can choose, and the audit log records who did.
- **The connection that sends can't be removed or turned off.** Choose another, or the code's, first. Otherwise one click leaves the site with no email at all.
- **Every server follows.** The choice is stored in the database, and each server reads it again every 30 seconds, so nothing needs redeploying.
- **Emails already waiting to be retried** go with whichever provider is in use when they are retried.

## Keys in the database, encrypted

[ADR-0034](https://github.com/maritonx/easy-cms/blob/main/docs/adr/0034-admin-email-settings.md), written on 4 October 2026, had said no to exactly this. People asked to edit SMTP settings in the admin, and I wrote that storing an SMTP password in the database was a bigger security decision than that page, and left it for later. The page could show settings and send a test, nothing more.

What changed was that the Integrations page arrived in between, for AI providers and chat notifications, with its own answer to storing secrets. Values marked `secret` are encrypted in the database with AES-256-GCM, with a key derived from the app's `secret`. They are never sent back to the admin, which shows them as `••••1234`, and an environment variable named for a field wins over what the admin typed. After rotating `secret`, connections are encrypted again with the new one, and `easy-cms secrets:rotate` does them all at once.

Email providers are integrations, so they got the same treatment instead of a second scheme. A database dump alone doesn't contain a working email key. A dump and the `secret` together still do; there is no way around that while the server has to send mail on its own.

## What happened after sending

Sending is half of it. The other half is knowing whether the email arrived.

Each Resend, Postmark and Brevo connection shows a **webhook URL**, `<api>/admin/integrations/resend/webhook/<token>`. You add it at the provider with the events in this table:

| Provider | Events | Checked by |
|---|---|---|
| Resend | `email.delivered`, `email.bounced`, `email.complained` | URL token, and the signing secret (`whsec_…`) if set |
| Postmark | Delivery, Bounce, Spam Complaint | URL token |
| Brevo | Delivered, Hard bounce, Soft bounce, Complaint | URL token |

The token is an HMAC of the app's `secret`, so it names the connection and can't be guessed; tokens made with earlier secrets keep working after a rotation. Resend signs its webhooks (Svix style), and when you paste the signing secret, unsigned requests and ones older than five minutes are refused.

![How the site's email is chosen and followed: the code's default, a provider connected in the admin with an encrypted key and a verified sender, a test email before switching, then sending, the provider's webhook, the email log and the suppression list](/images/blog/email-providers/diagram-1.png)

Each event marks the email in the log as **delivered**, **bounced** or **reported as spam**. A bounce that may pass, like a full mailbox, isn't kept. An address that bounced for good, or whose owner reported spam, goes on the **suppression list**, shown as **Blocked addresses** in Settings → Email, and gets no more email; the log shows those as not sent. Admins can add addresses and take them off.

One exception took some thought. Someone who reported a newsletter as spam may still forget their password. Emails people ask for themselves (a password reset, an invitation, an email check) still go to an address that reported spam. They don't go to one that bounced, because it can't receive them.

The other choice I made on purpose: if the suppression list can't be read, the email is sent anyway, and the error is logged. Losing a password-reset email seemed worse than sending one to an address that complained once.

`email.bounced` and `email.complained` are also system events, so with `@easy-cms/plugin-notify` a team chat can hear about them.

## A log that forgets the content

Since 1.41.0, Settings → Email lists every email sent in the last 30 days: when, to whom, the subject, its kind (`password-reset`, `invite`, `form:contact`…) and how it went, whether sent, waiting with how many tries, or not sent and why. Search by recipient or subject, or filter by state and kind. Only admins of the whole site see it. Blind copies are counted, not named.

It never keeps what an email said. Password links and invitations sign people in, so storing their bodies would turn the log into a list of working login links. Form notifications carry whatever visitors typed. The cost is real: you can see that a message went to someone, not what it told them, and you can't resend it from the log. Thirty days is the default; `emailLog: { keepDays: 90 }` keeps it longer, and `emailLog: false` keeps none.

With the providers in, the page became one summary line, **Sends with** Resend, **Chosen in the admin**, from your sender, with **Use the code's** beside it. Under that sit two tabs: the emails, with a count of those that failed, bounced or were reported as spam in the last 7 days, and the blocked addresses.

## What's still missing

- **Postmark and Brevo webhooks aren't signature-checked.** Only the secret URL token protects them. Anyone who learns that URL can mark emails as bounced and fill the suppression list. Resend's signing secret is optional too.
- **Three providers over HTTP.** Amazon SES, Mailgun and others go through SMTP, which works but gets no delivery events, or through your own `defineEmailProvider()`.
- **No content in the log**, by design, so no "resend this email" either.
- **The test-email limit** (5 in 10 minutes) is counted in memory per server, so on serverless hosts it is loose.
- **File storage can't be switched from the admin yet.** ADR-0066 orders these switches by risk: backups, then email, then sign-in (which followed in 1.43.0), then storage. Storage is last because every file first has to remember which storage it is in, so old files still open after a switch.

## Try it

```bash
npm install @easy-cms/plugin-email
```

Then add `emailPlugin()` as above, create a migration (`npx easy-cms migrate:create email`), and connect a provider in Settings → Integrations → Email. The [email guide](/docs/email) covers SMTP, providers, webhooks and the log.

If you use a provider that isn't here, or you've been bitten by an email problem this wouldn't catch, tell me in [GitHub discussions](https://github.com/maritonx/easy-cms/discussions). And if you missed it, [the post about where Easy CMS is going](/blog/more-than-a-cms) explains why the admin is getting more of these switches.
