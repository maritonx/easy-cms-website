---
title: "A contact form that keeps bots out: built-in checks, Turnstile, and messages deleted after a year"
slug: contact-form-bots
language: en
category: Guide
publishedAt: 2027-04-05
coverText: "Turnstile"
excerpt: "How the Easy CMS form builder decides whether a submission came from a person (a honeypot, a signed timing token, a rate limit that keeps no IP, optional Cloudflare Turnstile), what it stores, how old messages go, and the contact button on easycms.dev built on it."
---
On 13 November 2026, easycms.dev got a contact button in the bottom-right corner. Behind it is no third-party form service. It is the form builder plugin of Easy CMS, the same one anyone can install, running in the site's own admin on its own database.

A public form is an open door, and the first visitors through it are rarely people. This post is about how the form builder decides who gets in: the checks it always runs, the one it can add, what it stores, how old messages go away, and the parts I haven't solved.

## The form builder in one minute

`@easy-cms/plugin-form-builder` adds **Forms** to the admin. Editors build a form from blocks (text, long text, email, number, phone, choice, checkbox, date, and a message between fields), choose what happens after sending and who gets an email. A page shows it with one element, or renders it itself from the API.

```ts
import { consoleEmail, defineConfig } from '@easy-cms/core'
import { formBuilderPlugin } from '@easy-cms/plugin-form-builder'

export default defineConfig({
  // …
  email: consoleEmail(), // or smtp() from @easy-cms/email-smtp
  plugins: [formBuilderPlugin({ defaultTo: 'hello@example.com' })],
})
```

```html
<script type="module" src="/api/cms/form/element.js"></script>
<easy-form form="contact"></easy-form>
```

The plugin adds two collections, `forms` and `form-submissions`, so it needs a migration (`easy-cms migrate:create forms`). Forms have drafts, and only a published form accepts submissions.

The part I care about here is the submissions collection's access rules. Logged-in users can read submissions, only admins can delete them, and nobody can create or update one through the REST API. A submission only comes from the form's own endpoint, `POST <api>/form/:slug/submit`, after every check below has passed.

## What happens to one submission

![The checks a submission goes through in order: honeypot, field validation, signed timing token, Cloudflare Turnstile when configured, and a rate limit; bots caught by the first and third get a fake thank you, the others get an error, and a submission that passes is stored without its IP address, announced as form.submitted, emailed, and old submissions are deleted](/images/blog/contact-form-bots/diagram-1.png)

The order matters, so here it is as the endpoint runs it.

**1. The honeypot.** Every form has a hidden field with a name bots like to fill in: `website`, or `homepage` or `url_address` if the form already uses that name. People never see it. It sits off-screen with `aria-hidden`, `tabindex="-1"` and `autocomplete="off"`, so screen readers and the keyboard skip it too. If it comes back with anything in it, the submission is a bot.

**2. The fields.** Next, the values are checked against the form: required fields, emails that look like emails, numbers within `min` and `max`, choices that are one of the choices, and lengths (1,000 characters for a text field, 10,000 for long text). Only the form's own fields are kept; anything else in the body is dropped. Field errors come back per field with a 400. This runs before the timing check on purpose: a person who forgot a field gets told, however fast or slow they were.

**3. The timing token.** When a page loads a form, `GET <api>/form/:slug` returns a token, `<time>.<signature>`, signed with the CMS secret. The submission sends it back. A token less than 2 seconds old (`minSubmitSeconds`) means nobody read the form. A token that doesn't verify, or is more than 24 hours old, gets "The form expired: reload the page and try again".

**4. Cloudflare Turnstile, if you turn it on.** The server sends the visitor's Turnstile response to Cloudflare's `siteverify` endpoint and waits at most 10 seconds.

**5. The rate limit.** At most 5 submissions per visitor and form in 10 minutes (`rateLimit: { max: 5, window: 600 }`). More get a 429 and "Too many submissions: wait a few minutes and try again".

Only then is the submission stored. The plugin announces it as a `form.submitted` event, queues the emails, and, if `retentionDays` is set, deletes old submissions. The visitor sees the form's confirmation message or is redirected.

## Lying to bots, on purpose

Look again at steps 1 and 3. A bot that fills the honeypot, or sends the form faster than a person could, doesn't get an error. It gets exactly the same response as a person: `{ confirmation }`, with the form's thank-you message. Nothing is stored and no email goes out.

The comment in the code says why: bots get the same answer as people, so they don't learn they were caught. An error is a signal. A script that gets a 400 for filling `website` will stop filling `website`. A script that gets a thank-you has no reason to change anything.

The trade-off is real, and it is mine to own. A person who submits in under 2 seconds, say with a browser that fills every field at once and a fast click, is told "thank you" and their message is dropped. I chose 2 seconds because a person has to at least read the labels, and you can raise or lower it with `minSubmitSeconds`. But a silent drop is the worst kind of failure for the one person it hits, and I don't have a way to tell them apart from the bots that also arrive fast.

The checks that a person could fail by mistake (a missing field, an expired page, Turnstile, the rate limit) all return a real error, because a person needs to know what to do next.

## A rate limit that keeps no IP address

A rate limit per visitor needs to know who the visitor is, and on a public form the only thing you have is the IP address. But the form builder's promise is that submissions are stored without IP addresses, and I didn't want a second table of IPs on the side.

So the key is a hash. For each submission the plugin computes an HMAC, with the CMS secret, of the IP address, the form and the current time window, and keeps the first 32 characters in a hidden `rateKey` field on the submission. Nobody can read that field through the API, and it is never shown. To check the limit it counts the form's submissions from the last 10 minutes whose key matches the current or the previous window.

Because the window is part of the hash, the key changes every 10 minutes. Two submissions from the same IP an hour apart have unrelated keys, so the stored keys can't be used to link one visitor's messages over time. And without the secret, a key can't be turned back into an address.

This depends on the server knowing the visitor's real IP. Behind a proxy you trust, you set `trustProxy` (Vercel and Netlify are recognized automatically). When the server can't tell the IP at all, every visitor shares one limit of ten times `max`, and the server logs a warning once. That fallback came from a mistake, which I'll come back to.

## Turnstile, only when you ask for it

The built-in checks stop simple scripts. A script that loads the page, waits a few seconds and leaves the hidden field alone gets past them. For that, the plugin can add [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/), a check that usually needs no clicks:

```ts
formBuilderPlugin({
  turnstile: {
    siteKey: process.env.TURNSTILE_SITE_KEY,
    secretKey: process.env.TURNSTILE_SECRET_KEY,
  },
})
```

The site key goes out with the form (`form.turnstile`), and `<easy-form>` loads Cloudflare's script with `render=explicit` and renders the widget into the form only then. Without a site key, no Cloudflare script is loaded at all. If your site has a Content Security Policy, add `https://challenges.cloudflare.com` to `script-src` and `frame-src`.

On the server, the check fails closed. A missing response, a network error, or Cloudflare not answering within 10 seconds all count as "not verified", and the visitor gets "Verification failed: try again". I'd rather lose a message to a Cloudflare outage than accept everything during one. The element then loads the form again, with a fresh token and a fresh challenge.

Turnstile is the one check that sends data about the visitor to someone else, which is why it is off unless you configure it, and why the privacy page on easycms.dev mentions it.

These checks aren't only for forms. Since 0.46.0 the token, the honeypot name, the rate keys and `verifyTurnstile` live in the core, and site members signing up go through the same token and Turnstile checks.

## Where the message goes

A stored submission keeps the values, the page it was sent from and the language. In the admin, the form's side panel shows how many submissions it has and exports them as CSV, with a byte-order mark so Excel reads Thai text, and with cells that start with `=`, `+`, `-` or `@` escaped so a spreadsheet won't run them as formulas.

Then people need to hear about it:

- **Emails.** Each form has a list of emails sent for every submission, with `{{name}}` for a field's value and `{{*}}` for all of them. "Reply to" can be `{{email}}`, so replying reaches the sender.
- **A confirmation to the sender.** An email whose "To" is `{{email}}` goes to whoever filled in the form, which means anyone can make the site send email to any address. So such an email can repeat only short fields (no long text, no `{{*}}`), each cut at 100 characters. Otherwise the form becomes a free way to send spam that comes from your domain.
- **Telegram.** Since 1.32.0 the plugin emits `form.submitted`, and `@easy-cms/plugin-notify` turns that into a Telegram message with the form's name and who sent it. Not the answers: they can be personal, so they stay in the admin.
- **Webhooks.** The same event, or a webhook on `form-submissions` creates, can send each submission to whatever you use.

Emails go through the configured email adapter, queued in the database and retried if sending fails.

## Deleting old messages, and how it really works

A contact form collects personal data, and the honest way to hold it is for a limited time. `retentionDays: 365` deletes submissions older than a year.

Here is exactly what that does, because the option's name promises a little more than the code. There is no scheduled job. At the end of each successful submission, the plugin looks for submissions older than `retentionDays` and deletes up to 50 of them. So old messages go when new ones arrive. A form that gets no new submissions keeps its old ones past the limit until one does. And the setting covers every form's submissions at once: there is no per-form retention.

For a contact form that gets messages regularly, this is close enough to "deleted after a year". For a form that goes quiet, it isn't, and that is the first thing on my list below.

## easycms.dev: the contact button

The button on easycms.dev is a good test, because it doesn't use `<easy-form>` at all. The site is Next.js and wanted its own design (a panel with links to the docs and GitHub discussions first, a hint to open a GitHub issue for bugs), so it renders the form itself with the plugin's client:

```ts
import { getForm, submitForm } from '@easy-cms/plugin-form-builder/client'

const form = await getForm('contact', { api: '/api/cms', locale: null })

const result = await submitForm(
  'contact',
  {
    data: { kind, message, email, name },
    token: form.token,
    page: location.pathname,
    locale: null,
    ...(form.turnstile ? { turnstile: turnstileToken } : {}),
    [form.honeypot]: honeypotValue,
  },
  { api: '/api/cms' },
)
```

A few choices in that component are worth copying:

- **Nothing loads until someone clicks.** The form (and its token) is fetched when the panel opens for the first time, and Cloudflare's script only when the panel is open and the form came back with a site key. A visitor who never clicks loads no form and no Turnstile.
- **It renders the honeypot itself**, off-screen with `aria-hidden`, `tabIndex={-1}` and `autoComplete="off"`, with the name the API gave it. A custom form that forgets the honeypot field still works, but loses that check.
- **A 400 without field errors loads a fresh token.** That is the "form expired" case: someone left the tab open for a day. They get the message and can send again without reloading the page.

On the server, the site's config turns on Turnstile only when both keys are in the environment, and keeps messages for a year:

```ts
formBuilderPlugin({
  retentionDays: 365,
  ...(process.env.TURNSTILE_SITE_KEY && process.env.TURNSTILE_SECRET_KEY
    ? { turnstile: { siteKey: process.env.TURNSTILE_SITE_KEY, secretKey: process.env.TURNSTILE_SECRET_KEY } }
    : {}),
}),
notifyPlugin(),
```

Locally and in previews without the keys, the form works with the built-in checks only, and nobody has to fake a Cloudflare account.

The form itself is seeded by a script: a required "Type" choice with five values, a required question, a required email and an optional name. Its email's "To" is left empty for an admin to fill in, so no address lives in the repository. There is one catch to rendering a form yourself: the field names and choice values now live in two places, the form in the database and the component that sends them. The seed script says so in a comment: editors may change the texts and emails in the admin, but not the field names or the type values.

Finally, the site's [privacy page](/privacy) says in one paragraph what the form keeps (the type, the question, the email, the name if given, and the page), that it keeps no IP address, that messages are deleted after 365 days, that maintainers are told by email and Telegram, and that Cloudflare checks the sender when Turnstile is on. Writing that paragraph was easy because each sentence maps to a line of config.

## What went wrong along the way

Three bugs from the changelog, all fixed, all the kind that only show up outside the test suite:

- **0.20.1, the same day as the first release.** `<easy-form>` read `form`, `api` and `locale` only as attributes. Vue and React set *properties* on custom elements that have them, so `<easy-form :locale="locale">` in Vue was silently ignored. The element now takes all three both ways.
- **0.65.0.** Forms where the server couldn't tell the client's IP had no rate limit at all. Now all such visitors share one limit of ten times `max`, and the server warns once, so you find out you need `trustProxy`.
- **0.68.2.** The package declared no side effects, so Vite and other bundlers dropped `import '@easy-cms/plugin-form-builder/element'` in production builds and `<easy-form>` stayed empty. Development servers don't tree-shake, which hid it. The package now lists the element and its CSS as side effects.

## What's still missing

- **Retention needs a schedule.** Deleting old submissions should run as a job, not wait for the next submission, and should be able to differ per form.
- **No look at the content.** Every check is about how the form was sent, never what it says. A person, or a good enough script, can still send a message full of links.
- **A silent drop for very fast people.** I explained why above. I'd like a way to give a real person a second chance without teaching bots anything, and I don't have one yet.
- **One provider.** Turnstile is the only external check built in. Another would need its own option today.

The form builder is part of what level 4 of the roadmap calls a business engine, alongside the shop and many sites in one CMS; I wrote about the levels in [Easy CMS is not just a CMS](/blog/more-than-a-cms).

## Try it

The [Forms guide](/docs/forms) has every option, the client API and the `<easy-form>` attributes, and [Notifications](/docs/notifications) covers the Telegram side. If you run a public form and have found a bot pattern these checks miss, or a person they shouldn't have stopped, I'd like to hear it in [GitHub discussions](https://github.com/maritonx/easy-cms/discussions).
