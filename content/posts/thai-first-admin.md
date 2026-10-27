---
title: "A Thai-first CMS admin: i18n without vue-i18n, and docs in two languages"
slug: thai-first-admin
language: en
category: Engineering
publishedAt: 2027-01-18
coverText: "ภาษาไทย"
excerpt: "How Easy CMS keeps its admin in Thai and English with one typed file, separates UI language from content language, and tests docs in both."
---
Many CMS admins are written in English first. Translations often come later, from the community, and can lag behind new releases. For a developer that's fine. For an editor at a Thai company who updates the website between other jobs, an English admin means every button costs a moment of thought.

Easy CMS is built for that editor. The design doc lists the editor's needs in one line: an admin that's easy to use, in Thai, with drafts, preview and history. The localization ADR starts the same way: most of my clients build Thai websites that also need English. So Thai went in at v0.1, next to English, and it was never a "later" item.

This post covers what that took: a hand-rolled i18n file instead of vue-i18n, keeping the admin's language apart from the content's language, a few places where Thai text breaks English assumptions, and docs kept in two languages. [The first post in this series](FIRST_POST_URL) explains what Easy CMS is, so I won't repeat it here.

[TODO: your story — the first time a Thai editor used the admin in Thai, and what they said or did]

## The whole admin i18n is one file

The admin is a prebuilt Vue SPA. All of its text lives in `packages/admin/app/src/lib/i18n.ts`: 1,792 lines, 819 keys, each in English and Thai. Here is the part that does the work:

```ts
// packages/admin/app/src/lib/i18n.ts (trimmed)
export type Locale = 'en' | 'th'

const en = {
  'nav.create': 'New {name}',
  'list.selected': '{count} selected',
  // … 817 more
} as const

export type MessageKey = keyof typeof en

const th: Record<MessageKey, string> = {
  'nav.create': 'สร้าง{name}',
  'list.selected': 'เลือกแล้ว {count} รายการ',
  // …
}

export function t(key: MessageKey, params: Record<string, string | number> = {}): string {
  const template = messages[locale.value][key] ?? en[key]
  return template.replace(/\{(\w+)\}/g, (_, name: string) => String(params[name] ?? `{${name}}`))
}
```

The English object is the source of truth. Its keys become a type, and the Thai object must be a `Record` of exactly those keys. A missing Thai string fails `vue-tsc`. So does a leftover key that English no longer has, because TypeScript rejects extra properties in an object literal. A typo in `t('nav.creat')` fails too. I get "is every string translated?" from the type checker, for free.

`vue-i18n` isn't in the admin's dependencies. The admin ADR records "a built-in TH/EN dictionary" and a size budget for the first load, but not a reason for skipping a library. [TODO: why you hand-rolled i18n instead of using vue-i18n, in your words]

What the file doesn't do matters as much:

- **No plural rules.** Thai nouns don't change for number. You count with a classifier word: `เลือกแล้ว 3 รายการ` is roughly "selected 3 items". English gets away with `(s)`, as in `{n} field(s)`, in 9 strings. With only these two languages, plural machinery would serve nobody.
- **Whole sentences, never fragments.** Word order differs, so every key is a full template. `New {name}` becomes `สร้าง{name}` with no space, because Thai doesn't put spaces between words.
- **Dates come from `Intl`.** `formatDate` uses `Intl.DateTimeFormat('th-TH')`, which uses the Buddhist calendar. The same moment reads `21 Oct 2026, 16:30` in English and `21 ต.ค. 2569 16:30` in Thai. I didn't write any of that.

The cost: both dictionaries ship to every user. In the published 1.13.0 package they take about 24 KB of gzipped JavaScript. For two languages that's acceptable. For ten, I'd lazy-load them, and at that point a library starts to earn its place.

## Interface language is not content language

Early on I had to separate two things that sound like one: the language of the admin, and the language of the content being edited.

A Thai editor may translate a post into English while keeping the admin in Thai. A foreign colleague may fix a typo in the Thai version with the admin in English. So the admin keeps two settings, in two `localStorage` keys: `easy-cms-locale` for the interface, and `easy-cms-content-locale` for the content. Even plugin components get both: `uiLocale` for their labels, and `locale` for the content they edit.

![The English admin editing the Thai version of a post, with a content language switcher at the top](/screenshots/translate-en-light.webp)

The developer sets the default interface language and the content languages in the config:

```ts
// easy-cms.config.ts (trimmed from examples/nuxt-blog)
export default defineConfig({
  admin: { locale: 'th' },
  localization: { locales: ['th', 'en'], defaultLocale: 'th' },
  collections: [
    {
      slug: 'posts',
      fields: [
        { name: 'title', type: 'text', label: { en: 'Title', th: 'ชื่อเรื่อง' }, required: true, localized: true },
        { name: 'cover', type: 'upload', label: { en: 'Cover', th: 'รูปปก' } }, // shared by every language
      ],
    },
  ],
})
```

Two kinds of translation sit in that snippet. `label: { en, th }` translates the interface: the field's name in the admin. `localized: true` translates the content: the field stores one value per language, in its own column (`title`, `title__en`). Images and categories usually stay shared.

One detail matters here. When an editor opens the English version, the admin asks for it with `fallbackLocale=false`. Reads on the website fall back to Thai when English is empty, but the edit form must show the empty field. Otherwise the editor sees Thai text in the English form and thinks it's done.

And one cost: if a developer leaves out `label`, the admin builds one from the field name. `publishedAt` becomes "Published at", in English, even when the admin is in Thai. Thai field names need Thai labels in the config.

![The same post in the Thai admin: menu, buttons, and dates in the Buddhist calendar](/screenshots/edit-th-light.webp)

## Where Thai text breaks English assumptions

Most of these are one line of code. All of them break silently if you only test in English.

| English assumption | What happens to Thai | What the code does |
|---|---|---|
| A slug is `[a-z0-9-]` | `เริ่มต้นใช้ Easy CMS ใน 5 นาที` becomes `easy-cms-5` | `slugify` keeps letters, marks and digits of any script |
| Letters are `\p{L}` | Without `\p{M}`, vowel and tone marks are dropped: `เร-มต-นใช-easy-cms-ใน-5-นาท` | The regex is `[^\p{L}\p{M}\p{N}]+` |
| Length is `string.length` | `ที่นี่` has length 6, but people see 2 characters | The SEO plugin counts graphemes with `Intl.Segmenter` |
| Words are split by spaces | Reading time comes out far too short | The recipe counts characters, about 900 a minute for Thai |
| The system font is fine | Thai renders in whatever Thai font the OS has | The admin ships Anuphan; the Thai subset is 19 KB |

Thai also stacks vowels and tone marks above and below the letter, so look for clipping wherever you set a tight `line-height`. The admin's body text uses 1.55 and headings 1.25.

Two things aren't fully solved. Search: `{ like: '…' }` is a plain, case-insensitive substring match, with no Thai word breaking. On Postgres a trigram index (#176) keeps it fast in Thai, and a search adapter (#177) breaks Thai words with `Intl.Segmenter`, but the built-in adapter keeps its index in memory; for large sites you need an engine that handles Thai. And the browser's own date input ignores the admin's language: in the Thai screenshot it shows `08/10/2026` next to `9 ต.ค. 2569`.

## Docs in two languages, kept honest by tests

The docs site has 74 Markdown pages in `website/` and the same 74 in `website/th/`. Two languages of docs drift apart unless something stops them, so the site's tests check:

- every page in the sidebar exists in both languages, and every sidebar entry has an English and a Thai title (`sidebar.test.ts`);
- every guide page is in the sidebar, in both languages;
- every config option, field option, Local API method and CLI command has a row in the reference pages, in both languages (`reference.test.ts`). It reads the option names from the core's TypeScript types, so a new option without Thai docs fails CI.

Screenshots follow the same rule. `e2e/screenshots.ts` starts the Nuxt example on a throwaway database, seeds it with Thai and English content, and captures every view in both languages and both themes: 27 views, 108 images. It finds buttons by their accessible names in each language, so a renamed Thai label breaks the script, not the docs.

The project's 56 decision records are in Thai, and GitHub issues are in English. [TODO: why you write ADRs in Thai, and what that costs or saves you]

The real cost is time. Every docs change is written twice. Every new admin string needs a Thai version before the type checker lets it through. I think that's the right place for the cost: at the moment of writing, not months later when someone notices.

## If you build for a non-English market

- **Ship the second language in the first release.** Retrofitting `t()` around 800 strings is much harder than writing them that way.
- **Let the type checker count your translations.** `Record<keyof typeof en, string>` needs no tooling.
- **Use `Intl` before writing your own.** Dates, language names (`Intl.DisplayNames` gives "อังกฤษ" for `en` in a Thai UI) and graphemes are already there.
- **Keep the UI language and the content language apart**, in state, in URLs and in your plugin API.
- **Test with real text.** Seed fixtures in the language, not lorem ipsum. Slugs, counters and search break on real Thai, not on "Hello world".

## Limits

The admin interface speaks English and Thai only; a third language means a pull request to `i18n.ts`. Content languages can be any codes, but each localized field gets a column per language, so it fits a handful of languages (the roadmap says up to about five), not fifty. And as above, Thai `like` search is still a substring match, and the built-in search adapter is in-memory only.

---

Easy CMS is MIT-licensed: [github.com/maritonx/easy-cms](https://github.com/maritonx/easy-cms) · [docs](/docs). If you try it, tell me what got in your way in the [feedback issue](https://github.com/maritonx/easy-cms/issues/137).

*I drafted this post with Claude, working from the project's design docs and git history. The decisions, and the mistakes, are mine.*
