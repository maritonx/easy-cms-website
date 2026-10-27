---
title: "ทดสอบ Getting Started แบบคนนอก: Verdaccio กับ Ubuntu เครื่องเปล่า"
slug: testing-getting-started-th
language: th
category: Engineering
publishedAt: 2026-11-30
coverText: "npm · pnpm · bun"
excerpt: "CI ที่ใช้ workspace link บอกไม่ได้ว่าคนอื่นจะได้อะไรจาก npm แต่ registry ในเครื่อง, package manager สี่ตัว และ container ใหม่เอี่ยมบอกได้"
---
สองนาทีแรกของเครื่องมือ open source คือตัวผลิตภัณฑ์จริง ๆ คนหนึ่งอ่าน README พิมพ์คำสั่งเดียว แล้วถ้าไม่เห็นอะไรทำงาน เขาก็ปิดแท็บไป ไม่มีใครมาเปิด issue บอก เขาแค่ไปเงียบ ๆ

และสองนาทีนั้นคือส่วนที่ CI ของเราทดสอบได้แย่ที่สุด

ใน monorepo ตัว CI จะ install ทั้ง workspace แพ็กเกจชี้หากันผ่าน `workspace:^` link, pnpm store อุ่นอยู่แล้ว, `.npmrc` กับ `package.json` ของ repo เองก็มีผลอยู่ ทั้งหมดนี้คือของที่คนนอกไม่มีเลย CI ที่เขียวบอกเราได้ว่าโค้ดทำงาน แต่ไม่ได้บอกว่า `npm create your-thing@latest` จะเกิดอะไรขึ้นบนเครื่องคนอื่น กับ package manager ของเขา โดยดึงจาก registry จริง

[TODO: เรื่องของคุณ — ครั้งแรกที่การติดตั้งใหม่พังให้ใครสักคน (หรือตัวคุณเอง) ทั้งที่ CI ยังเขียวอยู่]

บทความนี้เล่าว่า [Easy CMS](https://github.com/maritonx/easy-cms) ซึ่งเป็น CMS ที่ติดตั้งลงในแอป Nuxt หรือ Next.js ([บทความแรกของซีรีส์](FIRST_POST_URL) แนะนำตัวมันไว้แล้ว) ทดสอบเส้นทางนี้ยังไง หน้า Getting Started ของมันมีคำสั่งเดียวคือ `npm create easy-cms@latest`

ถ้าคุณดูแลแพ็กเกจ npm หรือ template ของตัวเองที่มีคำสั่ง `npm create` หรือ `npx` ให้คนรันเป็นอย่างแรก เนื้อหาส่วนใหญ่ข้างล่างใช้ได้กับโปรเจกต์คุณด้วย ไม่ต้องใช้ Easy CMS เลยก็ได้

## เทสต์สองตัว ตอบคำถามคนละข้อ

| | Smoke test | Canary |
|---|---|---|
| คำถาม | *commit นี้* install ได้เหมือนตอน release จริงไหม | *ตัวที่ release อยู่บน npm* ใช้ได้ไหม ถ้าทำตาม guide ทุกตัวอักษร |
| แพ็กเกจมาจาก | commit นี้ publish ขึ้น registry ในเครื่อง | npmjs ผ่าน dist-tag (`latest` หรือ `rc`) |
| Package manager | npm, pnpm, Yarn 1, Yarn stable, Bun | npm |
| เครื่อง | GitHub runner (Ubuntu, Windows) | container `ubuntu:26.04` ใหม่เอี่ยม |
| โปรเจกต์ | Standalone server | Standalone, Next.js และ Nuxt |
| รันเมื่อไหร่ | ทุก pull request | รันมือ กับ `latest` หรือ `rc` |

![smoke test publish commit ขึ้น Verdaccio แล้ว scaffold ด้วย package manager ห้าตัวบน Ubuntu และ Windows ส่วน canary ติดตั้ง release จาก npm ใน container Ubuntu 26.04 ใหม่](/images/blog/testing-getting-started/diagram-1.th.png)

Smoke test ถูกพอจะรันทุก PR ส่วน canary ช้ากว่า แต่ใกล้ความจริงกว่า

## ขั้นที่ 1: publish commit นี้ขึ้น registry ในเครื่อง

[Verdaccio](https://verdaccio.org/) เป็น npm registry ตัวเล็ก ๆ ที่รันใน CI job ได้ config ของมันทำเรื่องสำคัญอยู่เรื่องเดียว คือแพ็กเกจของโปรเจกต์เองต้องมาจาก Verdaccio *เท่านั้น* ส่วนที่เหลือดึงจาก npmjs

```yaml
# smoke/verdaccio.yaml (excerpt)
uplinks:
  npmjs:
    url: https://registry.npmjs.org/
packages:
  '@easy-cms/*':
    access: $all
    publish: $authenticated
  # easy-cms กับ create-easy-cms: ตั้งเหมือนกัน ไม่มี proxy
  '**':
    access: $all
    proxy: npmjs
```

การไม่ใส่ `proxy` ให้ `@easy-cms/*` แปลว่า Verdaccio จะถอยกลับไปเอาเวอร์ชันที่ release แล้วไม่ได้ ถ้าแพ็กเกจของ commit นี้หายไป การ install ก็ต้องพัง

จากนั้น `smoke/publish.ts` จะ publish แพ็กเกจ public ทุกตัว มีรายละเอียดสองอย่างที่สำคัญ อย่างแรก มันใช้ `pnpm publish` ซึ่งแปลง `workspace:^` เป็น range จริงอย่าง `^1.13.0` แบบเดียวกับตอน release จริง อย่างที่สอง มันเลือกเวอร์ชันที่ไม่มีอยู่บน npmjs:

```ts
// smoke/publish.ts (excerpt)
// เวอร์ชันที่ npmjs ไม่มี ถ้า package manager ไปอ่าน registry อื่น มันจะพัง
// แทนที่จะแอบ install แพ็กเกจที่ release ไปแล้วแบบเงียบ ๆ
const version = `${base}-smoke.${Date.now()}`
```

รายละเอียดข้อที่สองนี้มีที่มาจากบั๊กในตัวเทสต์เอง เดี๋ยวจะเล่าข้างล่าง

## ขั้นที่ 2: scaffold แบบที่ผู้ใช้ทำ ด้วย package manager ทุกตัว

`smoke/scaffold.ts` สร้างโฟลเดอร์ temp ว่าง ๆ แล้วรันคำสั่งเดียวกับที่ผู้ใช้รัน: `npm create easy-cms@latest -- my-cms --yes`, `pnpm create easy-cms my-cms --yes` และแบบเดียวกันสำหรับ Yarn กับ Bun งานส่วนใหญ่อยู่ที่ environment ที่ใช้รันคำสั่งพวกนี้:

```ts
// smoke/scaffold.ts (excerpt)
const env: NodeJS.ProcessEnv = {
  ...process.env,
  npm_config_registry: REGISTRY,
  NPM_CONFIG_REGISTRY: REGISTRY,
  BUN_CONFIG_REGISTRY: REGISTRY,
  YARN_NPM_REGISTRY_SERVER: REGISTRY, // Yarn 2+
  YARN_REGISTRY: REGISTRY, // Yarn 1 ซึ่งไม่อ่านทั้ง npm_config_registry และ .npmrc ในโฟลเดอร์แม่
  YARN_UNSAFE_HTTP_WHITELIST: 'localhost',
  YARN_ENABLE_IMMUTABLE_INSTALLS: 'false',
  YARN_ENABLE_GLOBAL_CACHE: 'false',
  // Yarn 4.10+ รอหนึ่งวันก่อนจะ install เวอร์ชันใหม่ แต่พวกนี้เพิ่ง publish เมื่อนาทีที่แล้ว
  YARN_NPM_MINIMAL_AGE_GATE: '0',
  npm_config_user_agent: undefined,
  // cache ใหม่ทุกรอบ: รายการแพ็กเกจที่ cache ไว้จากรอบก่อนจะไม่รู้จักเวอร์ชันของรอบนี้
  npm_config_cache: join(root, '.cache', 'npm'),
  BUN_INSTALL_CACHE_DIR: join(root, '.cache', 'bun'),
  npm_config_store_dir: join(root, '.cache', 'pnpm'),
}
```

แต่ละบรรทัดคือบทเรียนหนึ่งข้อ ข้อที่ควรรู้ไว้ต่อให้ไม่เคยใช้ Easy CMS เลย:

**Yarn 1 ไม่สน `npm_config_registry`** และไม่สน `.npmrc` ที่อยู่ในโฟลเดอร์แม่ด้วย มันอ่าน `YARN_REGISTRY` อย่างเดียว ตอนที่ยังไม่ได้ตั้งตัวนี้ Yarn 1 แอบไป install แพ็กเกจที่ release แล้วจาก npmjs แบบเงียบ ๆ เทสต์ก็ผ่าน ทั้งที่ไม่ได้ทดสอบ commit นี้เลย มันพังให้เห็นก็ต่อเมื่อ CI บังเอิญรันตรงกับช่วงที่กำลังปล่อย release พอดี ผมเจอเรื่องนี้หลัง release 0.22 ที่เพิ่ม support package manager หลายตัวเข้ามา นี่คือเหตุผลที่ตอนนี้เวอร์ชันลงท้ายด้วย `-smoke.<timestamp>`: หลัง install เสร็จ script จะอ่าน `node_modules/@easy-cms/core/package.json` แล้วให้เทสต์ fail ถ้าเวอร์ชันไม่ตรง package manager ตัวไหนอ่านผิด registry ตอนนี้จะพังแบบเสียงดังแทน

**Yarn 4.10+ จะไม่ install อะไรที่ publish มายังไม่ถึงหนึ่งวัน** setting ตัวนี้ชื่อ `npmMinimalAgeGate` และเป็นค่า default ที่ดีสำหรับกันการโจมตีผ่าน supply chain แต่ใน smoke test แพ็กเกจทุกตัวเพิ่ง publish เมื่อนาทีที่แล้ว เทสต์เลยปิดมันไว้ ส่วนผู้ใช้ยังเปิดใช้ตามปกติ

**Cache โกหกได้** cache รายการแพ็กเกจจากรอบก่อนไม่รู้จักเวอร์ชันของรอบนี้ ทุกรอบเลยได้ npm cache, pnpm store และ Bun cache ของตัวเอง

**Process แม่รั่วค่าลงมา** `create-easy-cms` เลือก package manager จาก `--pm` ก่อน ถัดไปคือ field `packageManager` แล้วดู lockfile แล้วค่อยดู `npm_config_user_agent` script เลยล้างตัวแปรนี้ทิ้ง ให้เครื่องมือที่รัน `create` เป็นคนตั้งค่าเองเหมือนบนเครื่องผู้ใช้ จากนั้นก็เช็กผลลัพธ์: ต้องมี `pnpm-lock.yaml` สำหรับ pnpm, `yarn.lock` สำหรับ Yarn และ `bun.lock` สำหรับ Bun

**Yarn 1 สร้างโปรเจกต์จาก tag ไม่ได้** `yarn create easy-cms@rc` จะไปหา binary ที่ชื่อ `create-easy-cms@rc` ตรงตัว ถ้าจะทดสอบ release candidate ด้วย Yarn 1 script เลยใช้ `npx create-easy-cms@rc --pm yarn` ซึ่งก็คือสิ่งที่ผู้ใช้ Yarn 1 ต้องทำเหมือนกัน

**Corepack ไม่ยอมรัน Yarn ใน repo ที่ใช้ pnpm** `package.json` ของ repo ประกาศว่าใช้ pnpm ตัว CI job เลยไปเช็กเวอร์ชัน Yarn จากโฟลเดอร์ temp ของ runner แทน

มีอีกเรื่องหนึ่งที่เทสต์ตั้งใจ *ไม่* ทำ คือไม่เขียน `.yarnrc.yml` เลย กับ Yarn 2 ขึ้นไป `create-easy-cms` ควรเขียน `nodeLinker: node-modules` ให้เอง เพราะ Plug'n'Play ยังใช้กับ native binary อย่าง libsql และกับ framework ได้ไม่เต็มที่ ถ้าเทสต์เขียนไฟล์นี้เอง มันจะบังไม่ให้เห็นว่า scaffold พัง

หลัง install เสร็จ script จะรันขั้นตอนถัดไปที่ CLI พิมพ์บอกไว้ ในรูปแบบคำสั่งของ package manager ตัวนั้นเอง (`npx easy-cms migrate`, `pnpm exec easy-cms migrate`, `yarn easy-cms migrate`, `bunx easy-cms migrate`) สร้าง admin แล้ว start production server บน port ที่ OS บอกว่าว่าง (ถ้าสุ่ม port เองอาจไปชนกับ Verdaccio ที่ 4873) แล้วรอ `/healthz` จากนั้นถาม `/api/cms/auth/init` ว่ามี admin แล้วหรือยัง

ถ้าขั้นไหนพัง output 20 บรรทัดสุดท้ายจะถูกใส่ใน GitHub error annotation เพราะ annotation เปิดให้ทุกคนเห็น ส่วน job log ต้อง login ก่อนถึงจะดูได้ matrix รัน npm, pnpm, Yarn stable, Yarn 1.22.22 และ Bun บน Ubuntu และรัน npm กับ pnpm บน Windows

## ขั้นที่ 3: canary ใน container ที่ไม่มีใครเคยแตะ

Smoke test ยังรันบน GitHub runner ซึ่งมี Node, Git และ Yarn ติดตั้งมาให้แล้ว และมันทดสอบแค่ standalone server ไม่ใช่เส้นทาง Next.js กับ Nuxt ที่คนส่วนใหญ่ใช้ release เลยต้องผ่านเทสต์อีกตัวคือ `canary/run.sh`

บนเครื่อง host ตัว script จะเปิด container ใหม่แล้วรันตัวเองข้างใน:

```bash
# canary/run.sh (excerpt)
if [ ! -f /.dockerenv ]; then
  exec docker run --rm -e NODE_FROM="$NODE" -e EASY_CMS_TAG="$TAG" \
    -v "$(cd "$(dirname "$0")" && pwd)/run.sh:/canary.sh:ro" \
    "$IMAGE" bash /canary.sh "$IMAGE" "$NODE"
fi
```

ข้างใน `ubuntu:26.04` มันติดตั้งแค่ `curl`, `ca-certificates` และ `git` แล้วลง Node 24 จาก NodeSource (หรือใช้แพ็กเกจ `nodejs` ของ Ubuntu เองผ่าน `apt`) จากนั้นทำตาม Getting Started สามรอบ โดยใช้แพ็กเกจจาก npm:

1. **Standalone:** `npm create easy-cms@latest my-cms -- --yes` แล้ว `npm run dev`
2. **Next.js:** `npx create-next-app@latest` แล้ว `npx create-easy-cms`
3. **Nuxt:** `npm create nuxt@latest` แล้ว `npx create-easy-cms`

แต่ละรอบมันเช็กว่า `/admin` ตอบ 200 และถามหา admin คนแรก มันสร้าง admin คนนั้น publish โพสต์ผ่าน REST API (พร้อม session cookie และ CSRF token แบบที่ browser ทำ) แล้วอ่านกลับมา จากนั้นเอาโค้ดในหัวข้อ "Read content" ของ guide มาวางในแอป *ทุกตัวอักษร* แล้วเช็กว่าหน้าเว็บแสดงโพสต์นั้น ถ้าเอกสารเพี้ยนไปจากโค้ด canary ก็จะพัง

container ใหม่เอี่ยมทำให้เห็นของที่เครื่อง dev ไม่เคยแสดงให้เห็น:

- **แอป Nuxt ใหม่จะสร้าง Git repository ให้** Ubuntu เปล่า ๆ ไม่มี `git` script เลยต้องติดตั้งเอง
- **Nuxt ตอบ 503 ระหว่างกำลัง start** คำว่า "server ขึ้นแล้ว" เลยต้องหมายถึง "ตอบอะไรก็ได้ที่ไม่ใช่ 5xx" ไม่ใช่แค่ "port เปิดแล้ว"
- **`create-next-app` อาจวางแอปไว้ใน `src/app`** script เลยต้องเช็กว่าหน้าเพจต้องไปอยู่ตรงไหน
- **Nuxt ต้องการ Node 22.19** ซึ่งใหม่กว่าขั้นต่ำ 22.12 ของ Easy CMS เอง guide เลยเขียนบอกไว้ทั้งสองตัว
- **แพ็กเกจ `nodejs` ของ Ubuntu 26.04 มากับ npm 9.2** และพอใช้ npm 9 คำสั่ง `npm create nuxt` จะหยุดพร้อม error `Cannot read properties of null (reading 'edgesOut')`

ข้อสุดท้ายไม่ใช่บั๊กของ Easy CMS และผมแก้ให้ไม่ได้ แต่มันเกิดในสองนาทีแรกของคนที่เพิ่งมาเจอโปรเจกต์ บน Ubuntu รุ่นใหม่ล่าสุด ก่อนโค้ดของผมจะได้รันด้วยซ้ำ หน้า Getting Started เลยมีกล่องคำเตือนอยู่ใกล้ ๆ ด้านบน ให้เช็ก `npm --version` แล้วอัปเดต npm หรือติดตั้ง Node จาก NodeSource หรือ nvm

ตอนนี้ canary ยังไม่ได้อยู่ใน CI ผมรันมือ กับ `latest` หรือกับ tag (`EASY_CMS_TAG=rc canary/run.sh`) 1.0 ถูกปล่อยออกไปหลังจากมันผ่านบน Ubuntu 26.04 อีกเรื่องที่แยกกัน คือ test matrix หลักใช้ `ubuntu-latest` แทนการ pin image ไว้ พอ Ubuntu รุ่นใหม่ออกมา มันจะทำให้ job หนึ่งพังก่อน แทนที่จะไปพังตอน release

## คนนอกอีกแบบ: ผู้ใช้เมื่อเดือนที่แล้ว

ผู้ใช้เดิมก็มีสองนาทีแรกของเขาเหมือนกัน คือตอนอัปเกรด `upgrade/run.ts` จะสร้างฐานข้อมูลด้วย release 0.10, 0.20, 0.35, 0.48 และเวอร์ชันล่าสุดบน npm แล้ว migrate และอ่านด้วย commit ปัจจุบัน ทั้งบน SQLite และ Postgres ในทุกรอบของ CI

## สิ่งที่ยังไม่ครอบคลุม

- Yarn Plug'n'Play และ Bun runtime ใช้ Bun เป็น package manager ได้ แต่ตัว CMS ยังรันบน Node
- Smoke test scaffold แค่ standalone server เส้นทาง Next.js กับ Nuxt มีแค่ใน canary และใช้แค่ npm
- ยังไม่มี macOS ใน smoke matrix
- คำสั่งที่เขียนแทรกอยู่ในเนื้อความของเอกสาร (ไม่ได้อยู่ใน command block) ยังเป็นแบบ npm อย่างเดียว

## Checklist สำหรับ CLI หรือ template ของคุณเอง

ไม่มีข้อไหนผูกกับ Easy CMS ถ้าโปรเจกต์ของคุณมีทางเข้าเป็น `npm create` หรือ `npx`:

1. **Install จาก registry ไม่ใช่จาก link** publish commit ขึ้น Verdaccio ด้วยเครื่องมือเดียวกับที่ใช้ตอน release
2. **อย่า proxy แพ็กเกจของตัวเอง** แพ็กเกจที่หายไปควรทำให้พัง ไม่ใช่ถอยไปใช้ release ล่าสุด
3. **Publish เวอร์ชันที่ npmjs ไม่มี** (`x.y.z-smoke.<timestamp>`) แล้ว assert เวอร์ชันที่ install ได้
4. **ตั้ง registry แยกให้ package manager แต่ละตัว** Yarn 1 ใช้ `YARN_REGISTRY`, Yarn 2+ ใช้ `YARN_NPM_REGISTRY_SERVER`, Bun ใช้ `BUN_CONFIG_REGISTRY` หรือ `.npmrc`
5. **ปิด minimal age gate ของ Yarn เฉพาะในเทสต์**
6. **ใช้ cache ใหม่** ทุกรอบ
7. **ล้าง env ที่สืบทอดมา** อย่าง `npm_config_user_agent` แล้วเช็กว่าได้ lockfile ตัวที่คาดไว้จริง
8. **รันขั้นตอนถัดไปที่ CLI พิมพ์บอก** ตาม syntax ของ package manager แต่ละตัว
9. **รัน README ใน container ที่ไม่มีใครแตะ** ด้วยแพ็กเกจที่ publish แล้ว และวางโค้ดจากเอกสารลงไปตรง ๆ ทุกตัวอักษร
10. **ส่ง error ไปไว้ตรงที่คนจะเห็น** annotation ใน PR ดีกว่า log ที่ต้อง login ถึงจะเปิดได้

Script พวกนี้สั้นและเป็น MIT: [`smoke/`](https://github.com/maritonx/easy-cms/tree/main/smoke) และ [`canary/run.sh`](https://github.com/maritonx/easy-cms/blob/main/canary/run.sh) ส่วนไหนมีประโยชน์ก็หยิบไปใช้ได้เลย

[TODO: เรื่องของคุณ — หนึ่งบรรทัดว่าจะเพิ่มอะไรใน canary ต่อ หรือปัญหาที่คนอ่านเจอแต่ระบบนี้ยังจับไม่ได้]

---

Easy CMS เป็น open source (MIT): [github.com/maritonx/easy-cms](https://github.com/maritonx/easy-cms) · [เอกสารภาษาไทย](/th/docs) ถ้าลองแล้วติดตรงไหน บอกผมได้ที่ [issue สำหรับ feedback](https://github.com/maritonx/easy-cms/issues/137)

*ผมร่างบทความนี้ด้วย Claude จากเอกสารออกแบบและ git history ของโปรเจกต์ การตัดสินใจและความผิดพลาดเป็นของผมเอง*
