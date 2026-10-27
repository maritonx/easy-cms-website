---
title: "Typing CMS queries from a TypeScript config, with no codegen step"
slug: types-from-config
language: en
category: Engineering
publishedAt: 2027-01-11
coverText: "no codegen"
excerpt: "How const generics, mapped types and conditional types turn a CMS config into typed find() and create() results, and what that costs."
---
Most typed CMS setups have two sources of truth. There is the schema, which the CMS reads, and there is a generated `types.ts`, which your editor reads. A command keeps them in sync, as long as someone remembers to run it. When nobody does, the types describe last week's content model and the compiler happily approves code that breaks at runtime.

[TODO: your story — one line about a stale generated types file you ran into, or delete this line]

In Easy CMS, the CMS I build for Nuxt and Next.js (introduced in [the first post in this series](FIRST_POST_URL)), the schema is already TypeScript: an `easy-cms.config.ts` file. So the types can come straight from the config, with no generated file in between. This post walks through how that works at the type level, in simplified but faithful code, and what it costs. The techniques carry over to any library that takes a config object: form builders, routers, API clients.

## What you get

Given a config, the Local API knows the shape of every document:

```ts
const cms = await getEasyCMS(config) // useEasyCMS() in Nuxt
const { docs } = await cms.find('posts')

docs[0].title   // string (required: true)
docs[0].excerpt // string | null | undefined (optional)
docs[0].tags    // ('vue' | 'nuxt')[] (select with hasMany)
docs[0].author  // ID | User (an id, or the document when populated)
docs[0].status  // 'draft' | 'published' (drafts: true)

await cms.find('pots')                     // error: unknown collection
await cms.create('posts', { titel: 'Hi' }) // error: unknown field, and `title` is missing
```

![A config with a required text field and a select with hasMany becomes typed documents, and a misspelled collection name is an error](/images/blog/types-from-config/diagram-1.png)

Change a field in the config, save, and the next line of code that uses it is checked against the new shape. There's no step to forget.

## Step 1: keep the literals

Everything depends on one signature:

```ts
// packages/core/src/config.ts
export function defineConfig<const TConfig extends Config>(config: TConfig): TConfig {
  return config
}
```

At runtime it returns its argument. The work is in the `const` type parameter (TypeScript 5.0+). Without it, TypeScript widens `{ slug: 'posts', type: 'text' }` to `{ slug: string, type: string }`, and every field name and option is lost. With it, the inferred type keeps `'posts'`, `'text'` and `['vue', 'nuxt']` as literal, readonly types, as if the user had written `as const`. They don't have to.

The `extends Config` half matters too. It gives contextual types to callbacks inside the config (access rules, hooks), and it turns typos into good errors. With tsc 6.0.3, `type: 'txt'` reports `Did you mean '"text"'?`, and a `select` without `options` says the property is missing.

## Step 2: one field, one TypeScript type

A field definition becomes a value type through a chain of conditional types. Simplified from `packages/core/src/infer.ts`:

```ts
type OptionValue<O> = O extends string ? O : O extends { readonly value: infer V } ? V : never

type FieldValue<F, C> =
  F extends { readonly type: 'text' | 'textarea' | 'email' | 'slug' | 'date' } ? string
  : F extends { readonly type: 'number' } ? number
  : F extends { readonly type: 'boolean' } ? boolean
  : F extends { readonly type: 'select'; readonly options: readonly (infer O)[] }
    ? F extends { readonly hasMany: true } ? OptionValue<O>[] : OptionValue<O>
  : F extends { readonly type: 'relationship'; readonly to: infer S } ? RelationValue<C, S>
  : F extends { readonly type: 'group'; readonly fields: infer Sub extends readonly Field[] }
    ? FieldsValue<Sub, C>
  : F extends { readonly type: 'blocks'; readonly blocks: infer B extends readonly Block[] }
    ? BlockValue<B[number], C>[]
  : unknown
```

The real one also handles `richText`, `upload`, `array`, `json` and `hasMany` relationships the same way: match on `type`, then `infer` the parts you need. `OptionValue` lets `options` mix plain strings with `{ label, value }` objects.

## Step 3: a list of fields becomes an object

Fields arrive as a readonly tuple. Mapped types with key remapping (`as F['name']`) turn it into an object, and splitting the union in two decides what's optional:

```ts
type Visible<Fs extends readonly Field[]> = Exclude<Fs[number], { readonly hidden: true }>

/** Always set when read: required fields, and lists and groups (empty otherwise). */
type Present =
  | { readonly required: true }
  | { readonly type: 'array' | 'blocks' | 'group' }
  | { readonly hasMany: true }

type FieldsValue<Fs extends readonly Field[], C> = Simplify<
  { -readonly [F in Extract<Visible<Fs>, Present> as F['name']]: FieldValue<F, C> } & {
    -readonly [F in Exclude<Visible<Fs>, Present> as F['name']]?: FieldValue<F, C> | null
  }
>

type Simplify<T> = { [K in keyof T]: T[K] } & {}
```

A few decisions are encoded here:

- **Optional means `null` or missing.** Databases return `null` for empty columns, so `string | null | undefined` is the honest type for a field without `required: true`.
- **Lists are never null.** An array, blocks or `hasMany` field reads as `[]` when empty, and a group as `{}`. The type says so, which saves a `?? []` on every loop.
- **Hidden fields vanish.** A field marked `hidden` is stored but never returned, so it isn't in the type at all.
- **`-readonly` and `Simplify` are for humans.** The `const` parameter made everything readonly. Documents you get back are plain objects, so the modifier is stripped. `Simplify` flattens the intersection so hovering `Post` in your editor shows one object, not `A & B & C`.

## Step 4: relationships point back into the config

A relationship field stores `to: 'authors'`. To type it, look the slug up in the same config:

```ts
type CollectionBySlug<C extends Config, S> = Extract<AllCollections<C>, { readonly slug: S }>

/** An id at depth 0, the document when populated. */
type RelationValue<C extends Config, S> = ID | CollectionDocument<C, S>
```

`CollectionDocument` calls `FieldsValue` again, which can reach a relationship back to `posts`. That recursion is fine: TypeScript resolves object property types lazily, so `post.author.posts[0].author` type-checks without looping. The core has a test named "resolves relationships, including circular ones" to keep it that way.

## Step 5: blocks become a discriminated union

A `blocks` field holds rows of different kinds: a quote, an image, a call to action. Each block definition has a `slug`. A distributive conditional type maps each block to its own row type and tags it:

```ts
type BlockValue<B, C> = B extends {
  readonly slug: infer S
  readonly fields: infer Sub extends readonly Field[]
}
  ? Simplify<FieldsValue<Sub, C> & { id: string; blockType: S }>
  : never
```

The field passes `BlockValue<B[number], C>`, a union of every block definition. Because `B` is a naked type parameter, the conditional runs once per member, and the results form a union of row types. `blockType` is the discriminant, so narrowing works the way you'd hope:

```ts
for (const section of post.sections) {
  if (section.blockType === 'quote') section.author // only quote rows have author
}
```

## Step 6: what you write isn't what you read

`create()` needs a different type from `find()`. A relationship is written as an id, not a document. A date can be a `Date`. And "required" means something else for input:

```ts
type NeedsInput<F extends Field> = F extends { readonly required: true }
  ? F extends { readonly defaultValue: unknown } ? never
  : F extends { readonly type: 'slug'; readonly from: string } ? never
  : F extends { readonly admin: { readonly condition: object } } ? never
  : F
  : never
```

A required field with a default, a slug generated from another field, or a field a condition may hide doesn't have to be passed. That's why `cms.create('posts', { title: 'Hi', author: 1 })` compiles even when `slug` is required. Getting this wrong in either direction is annoying: too strict and people cast, too loose and the types stop catching bugs.

## Step 7: an option that changes the result

A localized field stores one value per locale. A normal read returns one locale, so `title` is a `string`. With `locale: 'all'`, the same call returns every locale at once, and since 1.4.2 the type says so. With `localization: { locales: ['th', 'en'] }` and a localized `title`:

```ts
const { docs } = await cms.find('posts', { locale: 'all' })
docs[0].title // { th?: string | null; en?: string | null }
docs[0].slug  // string (not localized)
```

So the return type depends on the value of an option. `find()` gets a second type parameter, inferred from `options.locale`:

```ts
// simplified from packages/core/src/local-api.ts
find<S extends Slug<C>, L extends string | undefined = undefined>(
  collection: S,
  options: FindOptions & { readonly locale?: L } = {},
): Promise<PaginatedDocs<Doc<C, S, L>>>

type AllLocales<C extends Config, L> = [L] extends ['all']
  ? C extends { readonly localization: { readonly locales: readonly string[] } } ? true : false
  : false
```

The `string` constraint makes TypeScript keep the literal `'all'`; without it, `L` widens to `string`. The brackets stop the check from distributing over a union, so only exactly `'all'` matches. A locale from a `string` variable gets the one-locale type, because the compiler can't know its value, and a config without `localization` ignores `'all'`.

The resulting `true` or `false` is passed down from `CollectionDocument` to `FieldValue` as an extra parameter. There, localized fields become maps:

```ts
// simplified from packages/core/src/infer.ts
type LocaleOf<C extends Config> = C extends {
  readonly localization: { readonly locales: readonly (infer L extends string)[] }
}
  ? L
  : string

type LocaleMap<F extends Field, C extends Config> = {
  [L in LocaleOf<C>]?:
    | (F extends { readonly type: 'relationship' | 'upload' } ? ID : FieldValue<F, C>)
    | null
}
```

The keys come from the config's own locale list, and each is optional and nullable because a locale may not be filled in yet. Localized relationships stay ids (`ID[]` with `hasMany`), since this read doesn't populate them. To name the type, pass the flag yourself: `CollectionDocument<typeof config, 'posts', true>`, and the same for `GlobalDocument`.

## Step 8: fields that plugins add

Plugins were the hard part. At runtime a plugin is `(config) => config`. It can add a `meta` group to every post, and the type system can't see that.

The fix stores what a plugin adds on a property that exists only in the type:

```ts
// packages/core/src/config.ts
declare const PLUGIN_TYPES: unique symbol

export interface PluginTypes {
  readonly fields?: { readonly [collection: string]: readonly Field[] }
  readonly globalFields?: { readonly [global: string]: readonly Field[] }
  readonly collections?: readonly CollectionConfig[]
}

export type TypedPlugin<T extends PluginTypes> = Plugin & { readonly [PLUGIN_TYPES]?: T }

export function definePlugin<const T extends PluginTypes = Record<never, never>>(
  plugin: Plugin,
  info?: PluginInfo,
): TypedPlugin<T> { /* attaches info, returns the plugin */ }
```

`declare const` with `unique symbol` creates a key nobody can write at runtime, so it costs nothing in the bundle. The inference reads `C['plugins']`, pulls `T` out of each with `infer`, and merges the extra fields into the matching collection before running `FieldsValue`. Added fields are written in the same shape as config fields, so every rule above applies to them for free. A plugin author writes:

```ts
type ReadingTimeField = { readonly name: 'readingTime'; readonly type: 'number' }

export function readingTime<const S extends string>(options: { collections: readonly S[] }) {
  return definePlugin<{ fields: { [K in S]: readonly [ReadingTimeField] } }>((config) => ({
    // … add the field at runtime
  }))
}
```

Two lessons from building this (written up in the project's ADR on typed plugins):

- **Put `const` on the list, not on the whole options object.** A `const` generic over all options broke the parameter types of callbacks inside them, such as the SEO plugin's `generateTitle`. Only the slugs need to stay literal.
- **Non-literal options add nothing.** If someone passes a `string[]` variable, the map's key becomes `string`. Adding the fields to every collection would be wrong, so the type adds none. A `string extends keyof M` check catches this.

The same idea covers new field types. A package augments `interface CustomFieldTypes` with module augmentation, and `FieldValue` falls through to it. The `@easy-cms/fields` package uses this for a `color` field typed as `string`.

## What it costs

None of this is free. These are the costs I know about.

**Compile time.** I measured it with tsc 6.0.3 on an Apple M4, using a synthetic config: 100 collections, 18 fields each (relationships, groups, arrays, blocks), and one `find()` per collection. Type-checking that file took about 0.3 s and 110,000 type instantiations. The same file with the config typed as plain `Config` took about 0.12 s and about 1,100 instantiations. Real configs are much smaller: the example blog in the repo defines three collections and one global. Still, the cost grows with the config, and your editor pays it again as you type.

**Error messages.** The good ones are very good: `titel` gets `Did you mean to write 'title'?`. The bad ones print the whole config. A wrong slug in `find('pots')` says it isn't assignable to `CollectionSlug<{ readonly secret: "x"; readonly db: ...` and gets truncated before it lists the valid slugs.

**Silent loosening.** If the config isn't a literal (loaded at runtime, or annotated as `Config`), the slug type is just `string`. The Local API detects that with `string extends CollectionSlug<C>` and falls back to loose document types. That's better than errors everywhere, but it means a missing `defineConfig` gives you `Record<string, unknown>` without a warning.

**Drift between types and runtime.** The types are a second description of what the runtime does, written by hand. If the SEO plugin's runtime adds a field its `SeoMetaField` type doesn't list, nothing fails at compile time. Easy CMS guards this with `expectTypeOf` tests and with plugin tests that compare runtime field names to the ones in the type. Gaps do get through: until 1.4.2, `locale: 'all'` reads were typed as one locale (step 7). One I know of remains: if you rename a plugin's fields through its options, the type keeps the default names.

## When codegen is still the right tool

Inference only works where the config can be imported as a type. A Vite app in another repository, calling the REST API, can't do that. For that case there's a command:

```bash
npx easy-cms generate:types                       # writes easy-cms-types.ts
npx easy-cms generate:types --out ../web/src/cms.ts
```

The file has no imports: one interface per collection and global. To stop it from going stale, check it in CI:

```bash
npx easy-cms generate:types && git diff --exit-code easy-cms-types.ts
```

If the config changed and nobody regenerated the file, the diff is non-empty and the job fails.

One honest footnote on "no codegen": the Nuxt module does write a small `.d.ts` into `.nuxt/`. It doesn't describe fields, though. It declares `useEasyCMS()` as returning `EasyCMS<typeof import('<your config>').default>`, so it never needs regenerating when the config changes. In Next.js, `getEasyCMS<const C extends Config>(config)` gets the same result from a generic.

## If you're building something similar

- Use a `const` type parameter on your `defineX()` function, and keep `extends YourConfig` for contextual typing and errors.
- Write the mapping as small conditional types you can test one at a time with `expectTypeOf`.
- Type input and output separately. They differ more than you'd expect.
- Give the inference an escape hatch for non-literal configs instead of failing loudly.
- Keep codegen for the consumers that can't import your types, and check its output in CI.

---

Easy CMS is MIT-licensed: [github.com/maritonx/easy-cms](https://github.com/maritonx/easy-cms) · [docs](/docs). If you try it, tell me what got in your way in the [feedback issue](https://github.com/maritonx/easy-cms/issues/137).

*I drafted this post with Claude, working from the project's design docs and git history. The decisions, and the mistakes, are mine.*
