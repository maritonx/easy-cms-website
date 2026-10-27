---
title: "ให้ query ของ CMS มี type จาก config TypeScript โดยไม่ต้อง codegen"
slug: types-from-config-th
language: th
category: Engineering
publishedAt: 2027-01-11
coverText: "no codegen"
excerpt: "const generics, mapped types และ conditional types เปลี่ยน config ของ CMS ให้เป็นผลลัพธ์ find() และ create() ที่มี type ได้อย่างไร และต้องแลกกับอะไร"
---
CMS ที่มี type ส่วนใหญ่มีแหล่งความจริงสองที่ ที่หนึ่งคือ schema ที่ CMS อ่าน อีกที่คือไฟล์ `types.ts` ที่ generate ออกมาให้ editor อ่าน ทั้งสองอย่างตรงกันได้ด้วยคำสั่งหนึ่งคำสั่ง ตราบใดที่มีคนจำได้ว่าต้องรัน วันไหนไม่มีใครรัน type ก็จะบรรยาย content model ของเมื่อสัปดาห์ก่อน และ compiler ก็ปล่อยโค้ดที่จะพังตอน runtime ผ่านไปเฉย ๆ

[TODO: เรื่องของคุณ — หนึ่งบรรทัดเรื่องไฟล์ types ที่ generate ไว้แล้วค้าง ไม่ตรงกับ schema ที่เคยเจอ หรือลบบรรทัดนี้ทิ้ง]

ใน Easy CMS ซึ่งเป็น CMS ที่ผมทำให้ Nuxt และ Next.js (แนะนำไว้ใน[บทความแรกของซีรีส์นี้](FIRST_POST_URL)) schema เป็น TypeScript อยู่แล้ว คือไฟล์ `easy-cms.config.ts` เพราะฉะนั้น type จึงมาจาก config ได้ตรง ๆ ไม่ต้องมีไฟล์ที่ generate คั่นกลาง บทความนี้จะไล่ดูว่ามันทำงานยังไงในระดับ type ด้วยโค้ดที่ย่อให้ง่ายลงแต่ยังตรงกับของจริง และดูว่าต้องแลกกับอะไรบ้าง เทคนิคเหล่านี้ใช้ได้กับ library ไหนก็ได้ที่รับ config object เช่น form builder, router หรือ API client

## ได้อะไร

พอมี config แล้ว Local API จะรู้รูปร่างของทุก document:

```ts
const cms = await getEasyCMS(config) // ใน Nuxt ใช้ useEasyCMS()
const { docs } = await cms.find('posts')

docs[0].title   // string (required: true)
docs[0].excerpt // string | null | undefined (ไม่บังคับ)
docs[0].tags    // ('vue' | 'nuxt')[] (select แบบ hasMany)
docs[0].author  // ID | User (เป็น id หรือเป็น document ถ้า populate)
docs[0].status  // 'draft' | 'published' (drafts: true)

await cms.find('pots')                     // error: ไม่มี collection นี้
await cms.create('posts', { titel: 'Hi' }) // error: ไม่มี field นี้ และขาด `title`
```

![config ที่มี field ข้อความแบบ required และ select แบบ hasMany กลายเป็นเอกสารที่มี type และชื่อ collection ที่สะกดผิดกลายเป็น error](/images/blog/types-from-config/diagram-1.th.png)

แก้ field ใน config แล้วกด save โค้ดบรรทัดถัดไปที่ใช้ field นั้นจะถูกเช็กกับรูปร่างใหม่ทันที ไม่มีขั้นตอนไหนให้ลืม

## ขั้นที่ 1: เก็บ literal ไว้ให้ได้

ทุกอย่างขึ้นอยู่กับ signature นี้อันเดียว:

```ts
// packages/core/src/config.ts
export function defineConfig<const TConfig extends Config>(config: TConfig): TConfig {
  return config
}
```

ตอน runtime มันแค่คืน argument กลับมา งานจริงอยู่ที่ `const` type parameter (TypeScript 5.0 ขึ้นไป) ถ้าไม่มี `const` TypeScript จะขยาย `{ slug: 'posts', type: 'text' }` ไปเป็น `{ slug: string, type: string }` แล้วชื่อ field กับ option ทั้งหมดก็หายไป พอใส่ `const` type ที่อนุมานได้จะเก็บ `'posts'`, `'text'` และ `['vue', 'nuxt']` ไว้เป็น literal แบบ readonly เหมือนผู้ใช้เขียน `as const` เอง โดยที่ไม่ต้องเขียน

ครึ่งหลัง `extends Config` ก็สำคัญเหมือนกัน มันให้ contextual type กับ callback ใน config (access rule, hook) และทำให้พิมพ์ผิดแล้วได้ error ที่อ่านรู้เรื่อง กับ tsc 6.0.3 ถ้าเขียน `type: 'txt'` จะได้ `Did you mean '"text"'?` และ `select` ที่ไม่มี `options` จะบอกว่าขาด property

## ขั้นที่ 2: field หนึ่งตัว ได้ TypeScript type หนึ่งตัว

นิยาม field กลายเป็น type ของค่าผ่าน conditional type ที่ต่อกันเป็นทอด ๆ ย่อมาจาก `packages/core/src/infer.ts`:

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

ของจริงจัดการ `richText`, `upload`, `array`, `json` และ relationship แบบ `hasMany` ด้วยวิธีเดียวกัน คือ match ที่ `type` แล้ว `infer` ส่วนที่ต้องใช้ออกมา ส่วน `OptionValue` ทำให้ `options` ผสม string ธรรมดากับ object `{ label, value }` ได้

## ขั้นที่ 3: list ของ field กลายเป็น object

field เข้ามาเป็น readonly tuple ใช้ mapped type ที่ remap key (`as F['name']`) แปลงเป็น object แล้วแบ่ง union ออกเป็นสองกองเพื่อตัดสินว่าอะไรเป็น optional:

```ts
type Visible<Fs extends readonly Field[]> = Exclude<Fs[number], { readonly hidden: true }>

/** มีค่าเสมอตอนอ่าน: field ที่ required และ list กับ group (ถ้าว่างก็เป็นค่าว่าง) */
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

ในโค้ดนี้มีการตัดสินใจฝังอยู่หลายข้อ:

- **optional แปลว่าเป็น `null` หรือไม่มีเลย** database คืน `null` สำหรับ column ที่ว่าง ดังนั้น `string | null | undefined` จึงเป็น type ที่ตรงความจริงสำหรับ field ที่ไม่ได้ใส่ `required: true`
- **list ไม่มีวันเป็น null** field แบบ array, blocks หรือ `hasMany` จะอ่านได้เป็น `[]` ถ้าว่าง ส่วน group ได้ `{}` type บอกไว้ตรง ๆ เลยไม่ต้องเขียน `?? []` ทุกครั้งที่วนลูป
- **hidden field หายไปจาก type** field ที่ตั้ง `hidden` ถูกเก็บไว้แต่ไม่เคยถูกคืนออกมา จึงไม่อยู่ใน type เลย
- **`-readonly` กับ `Simplify` มีไว้ให้คนอ่าน** `const` parameter ทำให้ทุกอย่างเป็น readonly แต่ document ที่ได้กลับมาเป็น object ธรรมดา เลยถอด modifier ออก ส่วน `Simplify` ยุบ intersection ให้แบน เวลา hover ที่ `Post` ใน editor จะเห็นเป็น object เดียว ไม่ใช่ `A & B & C`

## ขั้นที่ 4: relationship ชี้กลับเข้าไปใน config

field แบบ relationship เก็บ `to: 'authors'` ไว้ จะให้มันมี type ก็ไปหา slug นั้นใน config เดียวกัน:

```ts
type CollectionBySlug<C extends Config, S> = Extract<AllCollections<C>, { readonly slug: S }>

/** เป็น id ที่ depth 0 และเป็น document เมื่อ populate */
type RelationValue<C extends Config, S> = ID | CollectionDocument<C, S>
```

`CollectionDocument` เรียก `FieldsValue` อีกรอบ ซึ่งอาจเจอ relationship ที่ชี้กลับมาที่ `posts` การวนกลับแบบนี้ไม่มีปัญหา เพราะ TypeScript resolve type ของ property ใน object แบบ lazy ดังนั้น `post.author.posts[0].author` จึงผ่าน type check โดยไม่วนไม่จบ ใน core มี test ชื่อ "resolves relationships, including circular ones" คอยกันไม่ให้พฤติกรรมนี้หลุด

## ขั้นที่ 5: blocks กลายเป็น discriminated union

field แบบ `blocks` เก็บแถวได้หลายชนิด เช่น quote, รูปภาพ, call to action แต่ละ block มี `slug` ของตัวเอง ใช้ distributive conditional type แปลงแต่ละ block เป็น type ของแถวชนิดนั้นแล้วติดป้ายไว้:

```ts
type BlockValue<B, C> = B extends {
  readonly slug: infer S
  readonly fields: infer Sub extends readonly Field[]
}
  ? Simplify<FieldsValue<Sub, C> & { id: string; blockType: S }>
  : never
```

field ส่ง `BlockValue<B[number], C>` เข้าไป ซึ่งเป็น union ของนิยาม block ทุกตัว เพราะ `B` เป็น naked type parameter conditional จึงทำงานทีละสมาชิก แล้วผลที่ได้รวมกันเป็น union ของ type แถว `blockType` เป็นตัว discriminant เลย narrow ได้อย่างที่ควรเป็น:

```ts
for (const section of post.sections) {
  if (section.blockType === 'quote') section.author // มี author เฉพาะแถวที่เป็น quote
}
```

## ขั้นที่ 6: สิ่งที่เขียนเข้าไม่ใช่สิ่งที่อ่านออกมา

`create()` ต้องใช้ type คนละตัวกับ `find()` relationship เขียนเข้าไปเป็น id ไม่ใช่ document date ส่งเป็น `Date` ได้ และคำว่า "required" สำหรับ input ก็มีความหมายต่างออกไป:

```ts
type NeedsInput<F extends Field> = F extends { readonly required: true }
  ? F extends { readonly defaultValue: unknown } ? never
  : F extends { readonly type: 'slug'; readonly from: string } ? never
  : F extends { readonly admin: { readonly condition: object } } ? never
  : F
  : never
```

field ที่ required แต่มีค่า default, slug ที่สร้างจาก field อื่น หรือ field ที่อาจถูก condition ซ่อนไว้ ไม่จำเป็นต้องส่งมา นี่คือเหตุผลที่ `cms.create('posts', { title: 'Hi', author: 1 })` compile ผ่านแม้ `slug` จะเป็น required ถ้าทำส่วนนี้ผิดไม่ว่าทางไหนก็น่ารำคาญทั้งคู่ เข้มไปคนก็ cast ทิ้ง หลวมไป type ก็จับบั๊กไม่ได้

## ขั้นที่ 7: option ที่เปลี่ยนผลลัพธ์

field ที่ localized เก็บค่าแยกตาม locale การอ่านปกติคืนมาแค่ locale เดียว `title` จึงเป็น `string` แต่ถ้าใส่ `locale: 'all'` คำสั่งเดียวกันจะคืนทุก locale มาพร้อมกัน และตั้งแต่ 1.4.2 type ก็บอกแบบนั้นด้วย ตัวอย่างนี้ตั้ง `localization: { locales: ['th', 'en'] }` แบบเว็บสองภาษาไทยกับอังกฤษ และให้ `title` เป็น field ที่ localized:

```ts
const { docs } = await cms.find('posts', { locale: 'all' })
docs[0].title // { th?: string | null; en?: string | null }
docs[0].slug  // string (ไม่ได้ localized)
```

แปลว่า type ของผลลัพธ์ขึ้นกับ "ค่า" ของ option `find()` เลยมี type parameter ตัวที่สอง ซึ่งอนุมานมาจาก `options.locale`:

```ts
// ย่อมาจาก packages/core/src/local-api.ts
find<S extends Slug<C>, L extends string | undefined = undefined>(
  collection: S,
  options: FindOptions & { readonly locale?: L } = {},
): Promise<PaginatedDocs<Doc<C, S, L>>>

type AllLocales<C extends Config, L> = [L] extends ['all']
  ? C extends { readonly localization: { readonly locales: readonly string[] } } ? true : false
  : false
```

constraint `string` ทำให้ TypeScript เก็บ literal `'all'` ไว้ ถ้าไม่มี `L` จะถูกขยายเป็น `string` ส่วนวงเล็บเหลี่ยมกันไม่ให้การเช็กกระจายไปตาม union จึงมีแค่ `'all'` ตรงตัวเท่านั้นที่ match ถ้า locale มาจากตัวแปร `string` จะได้ type แบบภาษาเดียว เพราะ compiler ไม่มีทางรู้ค่า และ config ที่ไม่มี `localization` จะไม่สนใจ `'all'`

ผลที่ได้เป็น `true` หรือ `false` จะถูกส่งต่อจาก `CollectionDocument` ลงไปถึง `FieldValue` เป็น parameter เพิ่มอีกตัว ที่นั่น field ที่ localized จะกลายเป็น map:

```ts
// ย่อมาจาก packages/core/src/infer.ts
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

key มาจากรายการ locale ใน config เอง ในตัวอย่างนี้คือ `th` กับ `en` แต่ละ key เป็น optional และ nullable เพราะบาง locale อาจยังไม่มีใครกรอก relationship ที่ localized ยังเป็น id (เป็น `ID[]` ถ้า `hasMany`) เพราะการอ่านแบบนี้ไม่ populate ถ้าอยากตั้งชื่อ type นี้ ให้ส่ง flag เอง: `CollectionDocument<typeof config, 'posts', true>` และ `GlobalDocument` ก็ทำแบบเดียวกัน

## ขั้นที่ 8: field ที่ plugin เพิ่มเข้ามา

plugin คือส่วนที่ยากที่สุด ตอน runtime plugin คือ `(config) => config` มันเพิ่ม group `meta` ให้ทุก post ได้ แต่ type system มองไม่เห็น

ทางแก้คือเก็บสิ่งที่ plugin เพิ่มไว้ใน property ที่มีอยู่แค่ใน type:

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
): TypedPlugin<T> { /* แนบ info แล้วคืน plugin */ }
```

`declare const` คู่กับ `unique symbol` สร้าง key ที่ไม่มีใครเขียนค่าได้ตอน runtime จึงไม่เพิ่มอะไรใน bundle เลย ตัวอนุมานจะอ่าน `C['plugins']` ใช้ `infer` ดึง `T` ออกมาจาก plugin แต่ละตัว แล้วรวม field ที่เพิ่มเข้าไปใน collection ที่ตรงกันก่อนจะรัน `FieldsValue` field ที่เพิ่มเขียนในรูปเดียวกับ field ใน config ทุกกฎข้างบนจึงใช้กับมันได้ทันทีโดยไม่ต้องทำอะไรเพิ่ม คนเขียน plugin เขียนแบบนี้:

```ts
type ReadingTimeField = { readonly name: 'readingTime'; readonly type: 'number' }

export function readingTime<const S extends string>(options: { collections: readonly S[] }) {
  return definePlugin<{ fields: { [K in S]: readonly [ReadingTimeField] } }>((config) => ({
    // … เพิ่ม field ตอน runtime
  }))
}
```

บทเรียนสองข้อจากการทำส่วนนี้ (เขียนไว้ใน ADR ของโปรเจกต์เรื่อง typed plugins):

- **ใส่ `const` ที่ list ไม่ใช่ที่ options ทั้งก้อน** `const` generic ที่ครอบ options ทั้งหมดทำให้ type ของ parameter ใน callback ข้างในพัง เช่น `generateTitle` ของ SEO plugin ที่ต้องเป็น literal จริง ๆ มีแค่ slug
- **options ที่ไม่ใช่ literal จะไม่เพิ่มอะไรเลย** ถ้ามีคนส่งตัวแปร `string[]` มา key ของ map จะกลายเป็น `string` การเพิ่ม field ให้ทุก collection คงไม่ถูก type เลยไม่เพิ่มสักตัว มีเช็ก `string extends keyof M` คอยจับกรณีนี้

แนวคิดเดียวกันใช้กับ field type ใหม่ด้วย package หนึ่งขยาย `interface CustomFieldTypes` ผ่าน module augmentation แล้ว `FieldValue` จะตกลงไปหามัน package `@easy-cms/fields` ใช้วิธีนี้กับ field `color` ที่มี type เป็น `string`

## ต้องแลกกับอะไร

ทั้งหมดนี้ไม่ได้มาฟรี นี่คือต้นทุนที่ผมรู้

**เวลา compile** ผมวัดด้วย tsc 6.0.3 บน Apple M4 กับ config สังเคราะห์ 100 collection collection ละ 18 field (มี relationship, group, array, blocks) และเรียก `find()` หนึ่งครั้งต่อ collection type check ไฟล์นั้นใช้เวลาประมาณ 0.3 วินาที และ type instantiation ประมาณ 110,000 ครั้ง ไฟล์เดียวกันแต่ประกาศ config เป็น `Config` เฉย ๆ ใช้ประมาณ 0.12 วินาที และ instantiation ประมาณ 1,100 ครั้ง config จริงเล็กกว่านี้มาก example blog ใน repo มีแค่ 3 collection กับ 1 global แต่ถึงอย่างนั้นต้นทุนก็โตตาม config และ editor ต้องจ่ายซ้ำทุกครั้งที่พิมพ์

**error message** ตัวที่ดีก็ดีมาก `titel` ได้ `Did you mean to write 'title'?` แต่ตัวที่แย่จะพิมพ์ config ออกมาทั้งก้อน slug ผิดใน `find('pots')` จะได้ error ว่า assign ให้ `CollectionSlug<{ readonly secret: "x"; readonly db: ...` ไม่ได้ แล้วข้อความโดนตัดก่อนจะไปถึงรายการ slug ที่ถูก

**หลวมลงแบบเงียบ ๆ** ถ้า config ไม่ใช่ literal (โหลดตอน runtime หรือประกาศเป็น `Config`) type ของ slug จะเหลือแค่ `string` Local API ตรวจเจอด้วย `string extends CollectionSlug<C>` แล้วถอยไปใช้ type ของ document แบบหลวม ๆ แบบนี้ดีกว่ามี error ทุกบรรทัด แต่ก็แปลว่าถ้าลืม `defineConfig` จะได้ `Record<string, unknown>` โดยไม่มีอะไรเตือน

**type กับ runtime เพี้ยนออกจากกัน** type เป็นคำบรรยายชุดที่สองของสิ่งที่ runtime ทำ และเขียนด้วยมือ ถ้า runtime ของ SEO plugin เพิ่ม field ที่ type `SeoMetaField` ไม่ได้ระบุไว้ ตอน compile จะไม่มีอะไรพัง Easy CMS กันเรื่องนี้ด้วย test `expectTypeOf` และ test ของ plugin ที่เทียบชื่อ field ตอน runtime กับใน type แต่ก็ยังมีหลุด ก่อน 1.4.2 การอ่านด้วย `locale: 'all'` มี type เป็นภาษาเดียว (ขั้นที่ 7) และยังมีอีกจุดที่ผมรู้ว่าค้างอยู่ ถ้า rename field ของ plugin ผ่าน options ของมัน type จะยังใช้ชื่อ default

## เมื่อไหร่ที่ codegen ยังเป็นเครื่องมือที่ถูก

การอนุมานใช้ได้เฉพาะที่ import config มาเป็น type ได้ แอป Vite ที่อยู่อีก repository แล้วเรียก REST API ทำแบบนั้นไม่ได้ กรณีนี้มีคำสั่งให้ใช้:

```bash
npx easy-cms generate:types                       # เขียนไฟล์ easy-cms-types.ts
npx easy-cms generate:types --out ../web/src/cms.ts
```

ไฟล์ที่ได้ไม่มี import มีแค่ interface หนึ่งตัวต่อหนึ่ง collection และ global ถ้าไม่อยากให้มันค้าง ให้เช็กใน CI:

```bash
npx easy-cms generate:types && git diff --exit-code easy-cms-types.ts
```

ถ้า config เปลี่ยนแต่ไม่มีใคร generate ไฟล์ใหม่ diff จะไม่ว่าง แล้ว job ก็ fail

ขอแก้ข้อความ "ไม่ต้อง codegen" ให้ตรงหน่อย: Nuxt module เขียนไฟล์ `.d.ts` เล็ก ๆ ไว้ใน `.nuxt/` จริง แต่ไฟล์นั้นไม่ได้บรรยาย field มันแค่ประกาศว่า `useEasyCMS()` คืน `EasyCMS<typeof import('<your config>').default>` จึงไม่ต้อง generate ใหม่เวลา config เปลี่ยน ฝั่ง Next.js ได้ผลแบบเดียวกันจาก generic ของ `getEasyCMS<const C extends Config>(config)`

## ถ้ากำลังทำอะไรคล้าย ๆ กัน

- ใส่ `const` type parameter ที่ฟังก์ชัน `defineX()` ของคุณ และเก็บ `extends YourConfig` ไว้เพื่อ contextual typing และ error ที่ดี
- เขียนการแปลงเป็น conditional type ตัวเล็ก ๆ ที่ test ทีละตัวด้วย `expectTypeOf` ได้
- แยก type ของ input กับ output ออกจากกัน สองอย่างนี้ต่างกันมากกว่าที่คิด
- เตรียมทางหนีให้การอนุมานเวลา config ไม่ใช่ literal แทนที่จะ fail เสียงดัง
- เก็บ codegen ไว้ให้ฝั่งที่ import type ของคุณไม่ได้ แล้วเช็ก output ของมันใน CI

---

Easy CMS เป็น open source (MIT): [github.com/maritonx/easy-cms](https://github.com/maritonx/easy-cms) · [เอกสารภาษาไทย](/th/docs) ถ้าลองแล้วติดตรงไหน บอกผมได้ที่ [issue สำหรับ feedback](https://github.com/maritonx/easy-cms/issues/137)

*ผมร่างบทความนี้ด้วย Claude จากเอกสารออกแบบและ git history ของโปรเจกต์ การตัดสินใจและความผิดพลาดเป็นของผมเอง*
