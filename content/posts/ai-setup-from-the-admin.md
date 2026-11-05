---
title: "AI alt text, SEO and translation in a Nuxt or Next.js CMS, set up from the admin"
slug: ai-setup-from-the-admin
language: en
category: Guide
publishedAt: 2027-02-18
coverText: "Settings → AI"
excerpt: "Connect Claude from the admin's Integrations page, then write alt text, translate a Thai post into English and fill the SEO fields. One line of code, once."
---
Adding AI to a site usually means a developer: an SDK, a key in a `.env` file, a route that calls the model, a button that calls the route. Then a redeploy every time someone wants another model, a lower limit, or one feature turned off.

In [Easy CMS](https://github.com/maritonx/easy-cms), the CMS that runs inside your Nuxt or Next.js app, that work is split differently. A developer adds one plugin, once. After that, everything in this post happens on one page of the admin, by whoever looks after the site: connecting Claude, choosing the model, setting how much each person may use, and turning features on and off. Then editors get three buttons where they need them: alt text for images, a translation of the post, and the text search engines show.

This is the hands-on version. How it works underneath (four providers without SDKs, the daily limit, translation that keeps formatting) is in [AI in a CMS admin](/blog/ai-in-the-admin).

## Once, in the code

This is the only step that needs a developer. Install the plugin:

```bash
npm install @easy-cms/plugin-ai
```

Add it to `easy-cms.config.ts`, the same file in Nuxt and Next.js:

```ts
import { aiPlugin } from '@easy-cms/plugin-ai'

export default defineConfig({
  // …
  plugins: [aiPlugin()],
})
```

The plugin keeps a small usage table (who used which feature, and how many tokens), so create a migration and run it where you deploy:

```bash
npx easy-cms migrate:create ai
npx easy-cms migrate
```

Deploy, and you're done with the code. If you open the Integrations page before installing it, the plugin is listed under **Plugins you can install** with this `npm install` command and a button to copy it.

The SEO button later in this post comes from the [SEO plugin](/docs/seo), and translation needs [localization](/docs/localization) in the config. If your site has them, there's nothing else to add.

## Connecting Claude in four steps

You need an API key from [console.anthropic.com](https://console.anthropic.com). The rest happens in the admin.

**1. Open Settings → Integrations.** The page lists every provider your plugins offer, by category, each with a status, and below them what the code already configures (email, storage, sign-in) marked **Set in code**. With the plugin installed, the AI category has an **AI settings** row and four providers: Anthropic (Claude), OpenAI (GPT), Google Gemini and OpenAI-compatible, all **Not connected**.

![The Integrations page: an AI category with the AI settings row and four providers not connected, Telegram under Notifications, and email, storage and sign-in set in code](/images/blog/ai-setup-from-the-admin/1-integrations.webp)

**2. Connect, and accept what is sent.** Press **Connect** on Anthropic, then **Connect an account**. The first time, the drawer shows **Before connecting**: the text and images used with AI features go to Anthropic, under its **Privacy policy**, and the key stays on your server. **Accept and connect** records who accepted, and when, in the audit log. You see this once per provider.

**3. Paste the key, and Save.** Paste the **API key**. The **Model** can stay empty, which uses `claude-sonnet-5-5`, or **Find Model** lists the models your key can use. Press **Save**. Before saving, Easy CMS asks the model for one word with your key. A wrong key is refused right there, with Anthropic's reason, instead of failing later in front of an editor.

**4. It says it works.** The row now says **1 connected**, and the connection's card shows its model and this month's requests and tokens. **Test** asks again whenever you want to check.

That's the whole setup. The browser never sees the key again: the admin shows `••••` and its last four characters, and the database keeps it encrypted. If you'd rather keep keys out of the admin, set `ANTHROPIC_API_KEY` on the server instead: the provider gets a connection named "Environment", and the environment wins over anything typed in the admin.

## Alt text for an image

Open an image in the media library. Next to **Alternative text** is **Write with AI**. The model looks at the image and writes one sentence of at most 125 characters, in the language you're editing. It lands in the field marked "Written by AI: check that it says what the image shows.", with **Undo** beside it. Nothing is saved until you press Save.

There's a quieter change too. In a post, an image field whose file has no alt text yet says **No alt text**, and clicking it opens the file to add one. That's where most missing alt text gets noticed.

## Translating a Thai post into English

The Next.js example's content is in Thai first, with English as a second locale, a common setup for Thai sites. Open a post, switch the content language to English, and every localized text field that has Thai text gets **Translate from TH**.

If the English version is still empty, the top of the form says how many fields aren't translated, for example "3 fields are not translated into EN yet.", with **Translate them from TH**. One press translates them all, one request per field, and one **Undo** takes them all back.

Rich text keeps its formatting. Bold stays bold, links stay links, and blocks inside the text stay where they were, because only the words are sent. Translation reads the Thai version as saved, so save your Thai edits first.

## SEO title and description

With the SEO plugin, the search result preview on a post has **Write title and description with AI**. One request writes both from the post's title and text, within the lengths the SEO plugin's meters ask for, in the language you're editing. If the fields already have text, it asks before replacing it. As always, they go into the form for you to check, with **Undo**.

## What the admin controls

The **AI settings** row on the same page is where cost and scope live:

- **Main connection.** The provider every feature uses, until a feature is given its own. With Claude and a local server both connected, translation could use one and alt text the other.
- **Requests per user per day.** 100 by default, counted from midnight in the site's time zone. Only successful requests count. A role can have its own number in **Settings → Roles** under **AI requests per day**, and 0 means that role can't use AI.
- **Features.** Alt text, Translation and SEO title and description, each with an on/off switch.
- **This month.** Requests and tokens **By user** and **By feature**. Prompts and answers aren't stored, only who asked, which feature, the tokens and when, for 90 days.

None of this needs a deploy. Turning off translation for a week, or giving interns 20 requests a day, is a change in the admin, and changes to the AI settings are recorded in the audit log.

## No key? A model on your own machine

**OpenAI-compatible** connects any server with an OpenAI-style API: Ollama, LM Studio, vLLM, or OpenRouter. For Ollama on the machine running the CMS:

1. **Connect** on OpenAI-compatible, and accept: here the text says data goes to the server at the address you give.
2. **Base URL**: `http://localhost:11434/v1`. Leave the **API key** empty.
3. **Find Model** lists the models you have pulled. For alt text, pick one that can read images.

The address is called from the CMS server, not from the browser, so `localhost` means the server. In production, give the address your server can reach.

Nothing leaves your infrastructure, and there's no bill per token. Expect smaller models to be weaker at Thai and at describing images than Claude. Try them on your own content before turning a feature on for everyone, and keep a hosted provider as the main connection if the results aren't good enough.

## What you end up with

One `npm install` and one line of config. After that, connecting, switching provider, changing model, limits and features are all done in the admin by the people who run the site. Every AI answer is a draft in the form, with Undo, until someone saves it.

Easy CMS 1.33 to 1.35 added these features, and [the AI guide](/docs/ai) has every option. If you set it up on a real site, I'd like to hear which step was less easy than this post makes it sound, in [the feedback thread](https://github.com/maritonx/easy-cms/issues/137).
