---
title: "AI in a CMS admin: four providers over plain fetch, a daily limit, and translation that keeps the bold"
slug: ai-in-the-admin
language: en
category: Engineering
publishedAt: 2027-02-15
coverText: "cms.ai"
excerpt: "How I added AI to an embedded CMS admin: four providers over plain fetch, no endpoint that takes a prompt, a daily limit per person, and translation that keeps the bold."
---
I put off AI in [Easy CMS](https://github.com/maritonx/easy-cms), the CMS that runs inside your Nuxt or Next.js app, for a long time. A chat box in the corner of an admin didn't seem to help anyone. What changed my mind was a narrower question: which fields do editors leave empty? The usual answers are the alt text of images, the description search engines show, and the second language.

All three are writing nobody enjoys, and all three have a right answer close enough that a model can draft it. So the first AI features are exactly those, each a button next to the field it fills. This post is about the decisions underneath: how to talk to four providers without their SDKs, why there is no endpoint that takes a prompt, how to keep a team's bill predictable, and how to translate rich text without losing the bold.

## The rules, before any code

I wrote these down first, because each one ruled out an easier design:

- **Keys stay on the server.** The browser never calls a provider. Keys are encrypted in the database, or come from the environment, which wins.
- **Nothing is saved by itself.** The answer goes into the field, marked as written by AI, with **Undo**. The editor saves, or doesn't.
- **The provider is the site's choice.** Claude, GPT, Gemini, or a server of your own like Ollama. No feature knows which one answers.
- **Cost is visible and capped per person.** One editor pressing a button in a loop shouldn't be a surprise on the invoice.
- **Admins agree to what is sent.** Connecting a provider shows what leaves the server and links to the provider's policy. Who accepted goes to the audit log.

## Four providers, no SDKs

Easy CMS installs into your app, so its dependencies become your dependencies. Three provider SDKs would add several packages to a project that uses one provider, or none. And the part of each API I need is small: send a system prompt, a user message with text and maybe images, get text and token counts back. So each provider is a `fetch`:

```ts
export interface AiProvider {
  /** The integration whose connections it answers with, e.g. `anthropic`. */
  readonly integration: string
  readonly generate: (
    values: Readonly<Record<string, string>>, // the connection: apiKey, model, baseUrl
    request: AiProviderRequest, // system, prompt, images (base64), json, maxTokens, signal
  ) => Promise<{ text: string; usage: { input: number; output: number } }>
}
```

The differences between the three API shapes fit in one file of about 370 lines:

| | Anthropic | OpenAI and compatible | Gemini |
|---|---|---|---|
| System prompt | `system` | a `system` message | `systemInstruction` |
| Image | `{ type: 'image', source: { type: 'base64' } }` | a `data:` URL | `inlineData` |
| Max tokens | `max_tokens` | `max_completion_tokens` on OpenAI, `max_tokens` on the rest | `maxOutputTokens` |
| JSON answers | in the prompt | `response_format: json_object` | `responseMimeType` |

The OpenAI-compatible provider is the same code as OpenAI with a **Base URL** field. That covers Ollama on `localhost:11434/v1`, OpenRouter, and most self-hosted servers. One detail: some of those servers accept a user message only as a plain string, not as a list of parts, so text without images goes as a string.

Structured output is where providers differ most, so I don't rely on any one feature. The JSON schema always goes into the system prompt in words too, and the answer is unwrapped from a Markdown fence if a model adds one:

```ts
/** Asks for JSON in words too: not every provider has a JSON mode. */
function systemOf(req: AiProviderRequest) {
  const json = req.json
    ? `Answer with JSON only, no other text, matching this JSON schema: ${JSON.stringify(req.json)}`
    : undefined
  return [req.system, json].filter(Boolean).join('\n\n') || undefined
}
```

Each provider also has a **Find** button on its model field that lists what your key can use, so nobody has to guess a model id.

## No endpoint that takes a prompt

The obvious API is `POST /api/cms/ai` with a prompt. I didn't build it. With it, anyone who can sign in to the admin has a free chatbot on the site's key, and the per-feature switches mean nothing.

Instead, each feature has its own endpoint (`/admin/ai/alt-text`, `/admin/ai/translate`, and one in the SEO plugin) and builds its prompt on the server from the document. The endpoint checks what the REST API would check: you can ask for alt text only on a file you may change, and a translation only for a document you may update. Everything then goes through one function:

```ts
const result = await cms.ai?.generate(
  {
    feature: 'summary', // must be in aiFeatures, and turned on
    system: 'You write short, plain excerpts.',
    prompt: `Summarize in one sentence:\n\n${post.text}`,
    images: [{ media: post.cover }],
    json: { type: 'object', properties: { excerpt: { type: 'string' } } },
  },
  { user, about: { collection: 'posts', id: post.id } },
)
```

`cms.ai` is `null` without the plugin, which makes "is AI set up?" a type question in your own code. Inside `generate`, in order: the feature must exist and be on, the user must have requests left today, the feature's connection is picked (or the main one), images are loaded, and the provider is asked. A 429 or 5xx gets one more try after a second. A request gets 60 seconds.

A 401 or 403 means the key is wrong or revoked, so it marks the connection: it shows as needing attention on the Integrations page and the dashboard, and the `integration.failed` event goes out. If the site also has the notify plugin, that becomes a Telegram message to whoever looks after the site.

## A limit per person, not a token budget

My first idea was a monthly token budget for the site. It's the number on the invoice, after all. But a shared budget fails badly: one person translating a long archive on Monday uses it up, and nobody can write alt text on Friday.

So the limit is per user per day: 100 requests by default, counted from midnight in the site's time zone. Only successful requests count, so a provider outage doesn't use up anyone's day. Admins change the number in the admin. A role can have its own number in **Settings → Roles**, and 0 means the role can't use AI at all.

```ts
aiPlugin({ limits: { perUserPerDay: 50, roles: { editor: 20 } } })
```

Tokens are still shown, just not as the limit. Each connection's card shows this month's requests and tokens, and the AI box breaks them down by user and by feature. What's stored for that is who asked, which feature and connection, the token counts and when, for 90 days. The prompt and the answer are not stored, because they're the site's content and personal data has no reason to sit in a usage table.

## Alt text: the smallest image that's big enough

The media library's **Alternative text** field gets **Write with AI**. The model looks at the image and writes one sentence:

```ts
system: [
  'You write alt text for images on a website: one plain sentence saying what the image',
  'shows, for people who cannot see it. Do not start with "Image of" or "Picture of".',
  `At most 125 characters. Write it in ${this.languageOf(options.locale)}.`,
  'Answer with the alt text only, without quotes.',
].join(' '),
```

The language comes from the content locale being edited, turned into a name with `Intl.DisplayNames` ("Thai", not "th"), which is clearer to a model than a code.

Which file to send took more thought than the prompt. The original upload is often a photo of several megabytes, and providers count image tokens by size. Easy CMS already makes resized copies, so it sends the smallest copy at least 1024 pixels wide, which is plenty to describe a picture. With no copy that size it sends the original, and a file over 4 MB is refused with a hint to add an image size of about 1024 pixels.

The answer goes into the field with a "Written by AI: check that it says what the image shows" hint and **Undo**. Upload fields in documents also mark images that have no alt text yet, and a click opens the file to add one. That nudge probably matters more than the button.

## SEO: two fields, one request

With the SEO plugin, the search result preview gets **Write title and description with AI**. Both come from one request that returns JSON, so they are written together and cost one of the day's requests. The source is the document's title and the text of its top-level text, textarea and rich text fields, cut at about 6,000 characters. A collection whose meaning lives somewhere else can pass its own `aiSource` function.

The plugin already knows the good lengths, because it draws the length meters, so it puts them in the prompt. If the fields already have text, the admin asks before replacing it.

## Translation that keeps the bold

Translating a text field is one request. Rich text is the interesting part, because it's a tree, not a string. A paragraph like "Install **Easy CMS** in five minutes" is three text nodes, and the middle one carries a bold mark.

I ruled out the two obvious approaches. Sending HTML or Markdown and parsing the answer back works until a model "fixes" a tag, drops a link, or reorders a list. Sending each text node on its own keeps the structure but translates fragments, and "in five minutes" alone loses the sentence it belongs to.

So the request sends each paragraph as its list of pieces, split where the formatting changes, and asks for the same shape back:

![A Thai paragraph with a bold name is split into three pieces where the formatting changes, translated as one paragraph, and the three English pieces go back into the same text nodes, so the bold stays on the name](/images/blog/ai-in-the-admin/diagram-1.png)

The system prompt asks the model to translate each paragraph as a whole, then split the translation into the same number of pieces, in the same order. Walking the tree records a setter for every text node, so filling the answer back is a loop:

```ts
const walk = (node: Node | undefined) => {
  if (!node || typeof node !== 'object') return
  const children = Array.isArray(node.content) ? node.content : []
  const texts = children.filter((c) => c?.type === 'text' && typeof c.text === 'string')
  if (texts.some((c) => c.text!.trim())) {
    paragraphs.push(texts.map((c) => c.text!)) // what the model sees
    slots.push(texts.map((c) => ({ set: (t: string) => (c.text = t) }))) // where it goes back
  }
  for (const child of children) if (child?.type !== 'text') walk(child)
}
```

Marks, links, list items and blocks are never sent, so they can't be lost. Blocks inside rich text, like a call-to-action with a heading, have their own text and textarea fields, and those go in as paragraphs of one piece each.

The answer is then checked against the shape that was sent: the same number of paragraphs, the same number of pieces in each, all strings. If anything differs, the translation is refused with "The translation lost its formatting; try again" rather than half-applied. That check is what lets the rest of the code trust the answer.

It isn't perfect. When word order changes between languages, the model decides which words land in the bold piece, and it may not pick the word you would. It is still easier to move bold by one word than to rebuild a paragraph.

In the admin, each localized field in a non-default locale gets **Translate from TH** (or whatever the default is). A document with fields still empty in this locale says "3 fields are not translated into EN yet." above the form, with **Translate them from TH**, which translates them all, one request per field, and one **Undo** for the lot. Translation reads the default locale as saved (a pending draft included), not what is still being typed in another tab.

## Testing without a provider

The end-to-end tests can't call a real model: it costs money, and the answers change. A small Node server stands in for Anthropic's API on its own port, and the example app points at it with `ANTHROPIC_API_URL`. It answers each feature by recognizing its system prompt. For translation it returns the same pieces with `[EN] ` in front of the first one, which proves the shape survived and makes the result easy to assert:

```ts
const text = JSON.stringify({
  paragraphs: paragraphs.map((p) => p.map((s, i) => (i === 0 ? `[EN] ${s}` : s))),
})
```

The test then translates a Thai post into English, one field and then all of them, and checks that the bold is still bold.

## What I'd tell myself at the start

- **Decide where the prompt lives before the first endpoint.** A generic prompt endpoint is the easy first step and the hardest one to take back.
- **Limit people, not the site.** A shared budget punishes everyone for one person's afternoon.
- **Send structure the model can't break.** Pieces in, pieces out, and a shape check, beats parsing markup a model has rewritten.
- **Treat "written by AI" as a draft.** The marker and Undo cost almost nothing, and they put a person between the model and your published page.

AI providers shipped in Easy CMS 1.33, alt text in 1.34, and SEO and translation in 1.35. [The AI guide](/docs/ai) has the setup. Writing help in rich text and social post text come next. If you try it with a real site, especially one in two languages, I'd like to hear what it gets wrong in [the feedback thread](https://github.com/maritonx/easy-cms/issues/137).
