---
title: "Docs screenshots from one command: Playwright, two languages, light and dark, and a mocked AI"
slug: docs-screenshots
language: en
category: Engineering
publishedAt: 2027-04-12
coverText: "120 screenshots"
excerpt: "Every admin screenshot in the Easy CMS docs exists four times, in English and Thai, light and dark. One Playwright script seeds a real admin and takes all 120, a mock Anthropic API makes the AI screens repeatable, and the website takes them from the commit of the latest release."
---
The Easy CMS docs have an admin screenshot on 22 pages, 35 of them, in English and in Thai. Each one exists four times: English light, English dark, Thai light, Thai dark. The reader gets the one that matches the page's language and their theme.

That is 120 image files. I have taken none of them by hand. They come from one command, `pnpm docs:screenshots`, which starts a real admin on a throwaway database, fills it with content, and photographs it. This post is how that script works, how it photographs AI features without calling an AI, how the website picks up the images, and what still goes wrong.

## Why not take them by hand

A Thai-first admin doubles every screenshot, and a dark theme doubles it again. One screen means four pictures, and they have to agree with each other: the same post open, the same menu, the same counts.

By hand, that falls behind on the first redesign. On 30 October 2026 (1.25.1) the admin got a two-column menu, and every screenshot in the docs showed the old one. Retaking them was one command and a review of the new images. By hand, it would have been 120 careful captures that all had to agree.

There's a second reason. When the script can't find a button by its accessible name in Thai, the screenshot fails. So it checks a little of the Thai admin every time it runs, on top of the end-to-end tests.

## What the script does

The script is `e2e/screenshots.ts`, about 800 lines of Playwright and plain `fetch`. You run it from the repository after `pnpm build`:

```bash
pnpm build
pnpm docs:screenshots
```

![The screenshot pipeline: the script seeds a Nuxt example and a Next.js example with a mock Anthropic API, photographs each screen in English and Thai, light and dark, and writes 120 WebP files to website/public/screenshots; the docs in the repository use them from main, while easycms.dev copies them from the commit of the latest npm release, so a new screenshot is missing there until the next release](/images/blog/docs-screenshots/diagram-1.png)

**1. Start an app nobody else uses.** It starts the Nuxt example blog with `nuxi dev` on port 3210, with a SQLite file in a temporary folder and a random `EASY_CMS_SECRET`. It also starts a mock OpenID Connect provider from the `auth-oauth` package's tests, so the single sign-on screens have a "Company SSO" button that works. When the script ends, it stops every process and deletes the temporary folder.

**2. Seed it like a person would.** The first request registers the first admin through `POST /api/cms/auth/first-register`, with a random password. Everything after that goes through the REST API with that session: three categories, cover images, media folders (one of them only some roles may change), a CSV file, a PDF and a text file, posts written in Thai and then translated to English, nested pages, redirects, an invited user who hasn't set a password yet, and a contact form.

A few details made the difference between "screenshots" and "screenshots that look like a real site":

- **Cover images are drawn, not downloaded.** Each is an SVG gradient with a few shapes, turned into a PNG with `sharp` and uploaded like any file. No stock photos, nothing to license, and every color is chosen.
- **The contact form has real submissions.** They are sent through the form's public endpoint, like a visitor would. And the script waits 2.1 seconds before sending, because a form sent less than 2 seconds after it loaded counts as a bot: without the wait, my own spam check would quietly drop them.
- **The invitation page needs a token.** The script signs one with the same secret it gave the CMS, so the "Set your password" screen shows what an invited person sees.

**3. Photograph each screen four times.** For each language and theme, the script opens a fresh browser context: a 1440 × 900 window, `colorScheme` set to light or dark, and an init script that sets the admin's language, theme and content language in `localStorage` before the page loads. Then it signs in and walks through 28 screens: the dashboard, the posts list and calendar, the editor, the SEO tab, ⌘K, the media library, roles, email settings, the audit log with a change open, the login page with single sign-on, and so on.

Before each shot it waits for something specific to be there, usually by role and accessible name:

```ts
await page.getByRole('tab', { name: 'SEO' }).click()
await page.getByRole('region', { name: t.preview }).scrollIntoViewIfNeeded()
await shot('seo')
```

`t` is a small dictionary, one in English and one in Thai: `'Search result preview'` and `'ตัวอย่างผลการค้นหา'`, `'Submissions'` and `'ข้อมูลที่ส่งมา'`. If a Thai label changes, or a button loses its name, the script stops there.

**4. Save WebP.** Each shot waits 400 ms more for animations, takes a PNG and converts it with `sharp` to WebP at quality 80, named `<screen>-<locale>-<theme>.webp`, into `website/public/screenshots`.

## Photographing AI without an AI

Two screens show AI features: the Integrations page with Claude connected, and a post's SEO tab after "Write title and description with AI", with the written title and description in the form and Undo beside them.

Calling a real provider for those would be wrong in every way. It needs a key on my machine, it costs money each run, and it answers differently each time, so every run would change the images for no reason. So the AI shots use a mock.

`e2e/ai-mock.ts` is a small Node server that speaks as much of Anthropic's API as the AI plugin uses: `GET /v1/models` and `POST /v1/messages`. The plugin reads its address from `ANTHROPIC_API_URL`, which defaults to `https://api.anthropic.com`, so the script just points it at `http://localhost:3212`. The mock accepts one API key, `sk-ant-e2e`, and returns 401 for anything else, the way the real API would.

Its answers depend on the system prompt the plugin sends. Alt text gets "A mountain lake at sunrise". An SEO request gets a fixed JSON title and description, in Thai when the system prompt asks for Thai and the page is in Thai, otherwise in English. Translation returns the same pieces with `[EN]` in front of the first one, so the shape the plugin checks is kept. The answer is always the same, so the picture is always the same.

The AI shots also run on a different app. The Nuxt example doesn't have the AI plugin, so the script starts the Next.js example on port 3211, on PGlite in the temporary folder. Then, once and in English, it connects the provider the way a person would: Integrations, **Connect Anthropic (Claude)**, accept the provider's policy, type the key, **Find Model**, choose "Claude E2E (claude-e2e-1)", **Save**, and make it the main connection. Only then does it loop over the languages and themes and press the AI button.

That setup is the part I like most. The screenshot of a connected provider is a connected provider, set up through the real admin, not a database row written to look like one. And the same mock serves the Playwright end-to-end tests, which do run in CI on every pull request. If the plugin starts calling the API differently, those tests fail before the screenshots go stale.

## How the docs show them

In the repository, the docs are a VitePress site, and a page asks for a screenshot by name:

```md
<Screenshot name="forms" alt="A contact form in the admin, with its submissions panel" />
```

The component builds the file name from the page's language and the reader's theme, `forms-th-dark.webp` for a Thai reader in dark mode, and sets `width="1440" height="900"` so the page doesn't jump while the image loads.

easycms.dev is a separate Next.js project. It doesn't run VitePress; it renders the same Markdown with its own renderer, which turns each `<Screenshot>` into two images, one shown in dark mode and one in light. Its home page also uses a few screenshots directly, in a panel that switches between admin screens.

## The website takes the commit of the release

Here is the decision that causes the one real problem.

The website doesn't keep its own copy of the docs or the screenshots; both folders are in its `.gitignore`. Before every build, `scripts/fetch-docs.mjs` downloads them from the Easy CMS repository. But not from `main`. It asks npm for the latest version of `@easy-cms/core`, reads that version's provenance attestation, and takes the git commit it was built from. Then it downloads the repository at that commit and copies `website/guide`, `website/th`, the sidebar and `website/public/screenshots`.

The reason: the docs on easycms.dev should describe what `npm install` gives you today. If they came from `main`, a reader could find an option that isn't released yet, copy it, and get an error. Screenshots follow the same rule, so a picture never shows a button the reader doesn't have.

The cost is that anything merged after a release isn't on the website until the next one. For docs text that is usually right. For screenshots it is sometimes awkward.

On 13 November 2026 I added two screenshots, `ai` and `integrations`, in all four variants, and the new home page used them in its admin panel. They aren't on any docs page; only the website's home page needs them. On `main` they existed. On the commit of the latest release they didn't, so until a release included them, a website build would have no such files and the home page would point at images that weren't there. The fix was a release: a patch changeset with no code change, whose description says it exists so the website gets the screenshots. 1.46.1 went out the same day.

There is an escape hatch for this. A `docs-ref.txt` file in the website repository names a commit to use instead, as long as GitHub says it is ahead of the released commit; once a release includes it, the script ignores it and says to delete the file. It was used once, on 17 October 2026, for a WordPress migration guide merged after 1.0.0, and removed with 1.0.1 the same day. For the screenshots I chose the release instead, because a pinned commit would also have brought every unreleased docs change with it.

## What isn't automatic yet

The title says "one command", not "automatic", on purpose.

- **No workflow runs it.** CI runs the end-to-end tests on every pull request, but not the screenshot script. `CONTRIBUTING.md` asks for `pnpm docs:screenshots` after admin changes, and I run it on my machine. If I forget, the docs show an older admin until someone notices.
- **There is no ADR for it.** The decisions live in the script's comments, in `CONTRIBUTING.md` and in `fetch-docs.mjs`. That is fine while one person runs it, and not fine once more people do.
- **The images are reviewed by eye.** A run rewrites all 120 files. Some change because the admin changed, and some because a date moved. The seeded posts are dated relative to today, so the calendar always shows the current month with posts on it, which also means the calendar shot is different every month. There's no pixel diff that says which changes matter.
- **Not everything is a perfect match.** The example blog's public pages have no dark theme, so the "dark" pictures of the form on a site page look like the light ones. And the content's default language is Thai, so lists in the English screenshots show Thai titles. That is true to how the example is set up, but it surprises English readers.
- **Waits are partly guesses.** Every shot waits for a real element, and then 400 ms more for transitions. That number came from trying, not from anything the admin reports.

## What I'd tell anyone doing this

If your docs have screenshots of your own app, a script that seeds it and photographs it pays for itself on the first redesign. Seed through your public API, so the data is shaped like real data. Find elements by role and accessible name, in every language you ship, so the script doubles as a check that those names exist. Mock any outside service that answers differently each time, and share that mock with your end-to-end tests, so it can't drift away from the real one unnoticed. And decide where the website takes its images from before you need to explain a missing one.

The screenshots are in the [Forms guide](/docs/forms), [Roles](/docs/roles) and most other pages of the [docs](/docs). The project is heading toward a whole TypeScript backend, which I wrote about in [Easy CMS is not just a CMS](/blog/more-than-a-cms). If you have a better way to review 120 changed images than looking at them, or you'd like the script to run in CI, tell me in [GitHub discussions](https://github.com/maritonx/easy-cms/discussions).
