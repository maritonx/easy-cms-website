---
title: "Five security bugs my self-review found that your app probably has too"
slug: self-review-security-bugs
language: en
category: Engineering
publishedAt: 2026-12-14
coverText: "X-Forwarded-For"
excerpt: "X-Forwarded-For, Content-Length, IPv6, presigned uploads and email links. Five bugs from a review of my CMS, each with the fix and a test."
---
A login rate limit, a request size limit, an SSRF guard, a file type check and a one-time link. Many web apps have most of these. All five can exist in the code, pass their tests, and still not do their job.

I found a broken version of each in my own project, Easy CMS, when I reviewed it against OWASP ASVS 5.0 Level 1 on 2026-10-09. To be precise about what that was: I read the monorepo (version 0.47.2) chapter by chapter, re-read the code for anything serious, and wrote a test that fails on the old code for each fix. It was a self-review, not a pentest or an external audit. It led to 17 fixes, released in 0.47.3, 0.47.4 and 0.48.0, and one of them needed a second part in 1.4.2. Twenty low-severity items went to a later milestone.

The worst finding, a multi-tenant permissions bug, is in [the first post in this series](FIRST_POST_URL). These five are less dramatic, but none of them is specific to a CMS. Each one is a pattern I'd expect to find in ordinary Node, Next.js or Nuxt code.

| | Bug | Fixed in |
|---|---|---|
| 1 | Client IP taken from the first `X-Forwarded-For` entry | 0.48.0 |
| 2 | Body size checked only through `Content-Length` | 0.47.4 |
| 3 | SSRF guard that misses IPv4 inside IPv6 | 0.47.4 |
| 4 | Direct-to-bucket uploads keep the browser's `Content-Type` | 0.48.0, finished in 1.4.2 |
| 5 | Email link that signs you in more than once | 0.47.4 |

## 1. The client IP is the last X-Forwarded-For entry, not the first

Failed logins were counted per email and client IP. Behind a proxy, the IP comes from `X-Forwarded-For`, and most code you find reads it like this:

```ts
// don't do this
const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
```

A proxy appends the address it saw to the end of the header. Anything before that came from the client, so the first entry is whatever the client chose to send. My rate-limit key was `${email}|${ip}`, so a different made-up address on each request meant a fresh counter each time. That meant unlimited password guesses.

![A client sends a made-up X-Forwarded-For, the proxy appends the real address; the first entry is whatever the client chose, the last is what the proxy saw](/images/blog/self-review-security-bugs/diagram-1.png)

The fix takes the entry your proxy added:

```ts
// packages/core/src/framework.ts
export function forwardedClientIp(value: string | null | undefined): string | undefined {
  const last = value
    ?.split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .at(-1)
  return last || undefined
}
```

That's right for exactly one proxy that you control. With two, such as a CDN in front of a load balancer, count that many entries from the right. On Vercel and Netlify, Easy CMS now reads the platform's own header (`x-real-ip`, `x-nf-client-connection-ip`). Without a proxy it uses the connection's address, and `trustProxy` is off by default. If it finds no IP at all, it logs a warning in production, because a limit per email alone lets anyone lock someone else out.

To test it, keep the last entry fixed and change the first one:

```ts
// adapted from packages/integration/test/framework.test.ts (maxLoginAttempts: 2)
let n = 0
const login = (ip: string, password = 'wrong-password') =>
  api(new Request('http://cms.test/api/cms/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': `6.6.6.${n++}, ${ip}` },
    body: JSON.stringify({ email: 'a@x.co', password }),
  }))

await login('1.1.1.1')
await login('1.1.1.1')
expect((await login('1.1.1.1', 'password123')).status).toBe(429)
expect((await login('2.2.2.2', 'password123')).status).toBe(200)
```

## 2. A size limit that only reads Content-Length

```ts
// don't do this
if (Number(request.headers.get('content-length') ?? 0) > MAX) return new Response(null, { status: 413 })
const body = await request.json()
```

A body sent with chunked transfer encoding has no `Content-Length`. `0 > MAX` is false, and `request.json()` then buffers the whole thing in memory. Nothing in the Fetch API limits it for you. My REST handler read such bodies whole before measuring them, so a few large requests could run the server out of memory.

The fix keeps the header check as a fast path, then counts bytes as they arrive:

```ts
// packages/core/src/rest/handler.ts (shortened)
async function readBody(request: Request, max: number): Promise<Uint8Array> {
  const tooLarge = () => new HttpError('Request body too large', 413)
  if (Number(request.headers.get('content-length') ?? 0) > max) throw tooLarge()
  if (!request.body) return new Uint8Array()
  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.byteLength
    if (size > max) {
      // Stop reading, without cancelling: undici, still filling a body made from FormData,
      // throws an unhandled error into a cancelled stream. Unread, the sender is held back.
      reader.releaseLock()
      throw tooLarge()
    }
    chunks.push(value)
  }
  // ...join the chunks into one Uint8Array
}
```

The comment is the second lesson. The obvious way to stop is `reader.cancel()`, and an earlier version of the fix did that. But undici, the HTTP client behind Node's `fetch`, throws an unhandled error into a cancelled stream when the `Request` body was built from `FormData` and is still being filled. Releasing the lock and leaving the rest unread stops the reading without that error, and backpressure holds the sender back.

The test sends 64 KB chunks with no length and counts how many were pulled:

```ts
// adapted from packages/integration/test/rest.test.ts
let sent = 0
const body = new ReadableStream<Uint8Array>({
  pull(controller) {
    if (sent >= 1600) return controller.close() // up to 100 MB
    sent++
    controller.enqueue(new Uint8Array(64 * 1024).fill(32))
  },
})
const response = await handle(new Request('http://cms.test/api/cms/auth/forgot-password', {
  method: 'POST', headers: { 'content-type': 'application/json' }, body, duplex: 'half',
} as RequestInit))
expect(response.status).toBe(413)
expect(sent).toBeLessThan(40) // the limit is 1 MB
```

## 3. An SSRF guard that forgets IPv4 inside IPv6

Easy CMS can download an upload from a link. That feature is off by default. When it's on, it resolves the host, refuses private addresses, and checks again after every redirect. The blocklist had the usual IPv4 ranges (`10.0.0.0/8`, `169.254.0.0/16` and so on) plus `::1`, `fc00::/7` and `fe80::/10`.

It missed IPv6 addresses that carry an IPv4 address in their last 32 bits. One is the NAT64 prefix `64:ff9b::/96`: on a network with NAT64, `64:ff9b::a9fe:a9fe` can reach `169.254.169.254`, the cloud metadata address. The other is the old IPv4-compatible form, `::/96`. Node's `net.BlockList` already treats `::ffff:` (IPv4-mapped) addresses as IPv4, but not these two. Matching on the dotted form doesn't help either, because the URL parser rewrites it: `new URL('http://[::ffff:127.0.0.1]/').hostname` is `[::ffff:7f00:1]`.

The fix pulls the embedded IPv4 address out and checks it as IPv4:

```ts
// packages/core/src/remote-file.ts (excerpt)
const EMBEDS_IPV4 = new BlockList()
EMBEDS_IPV4.addSubnet('64:ff9b::', 96, 'ipv6')
EMBEDS_IPV4.addSubnet('::', 96, 'ipv6')

// in isPrivateAddress(), for an IPv6 address:
const embedded = embeddedIPv4(address) // the last 4 bytes as a.b.c.d
if (embedded) return PRIVATE.check(embedded, 'ipv4')
return PRIVATE.check(address, 'ipv6')
```

Test both directions, so the fix doesn't simply block every IPv6 address:

```ts
// adapted from packages/core/test/remote-file.test.ts
for (const ip of ['::ffff:192.168.0.1', '64:ff9b::a9fe:a9fe', '64:ff9b::127.0.0.1', '::127.0.0.1'])
  expect(isPrivateAddress(ip), ip).toBe(true)
for (const ip of ['8.8.8.8', '2606:4700:4700::1111', '64:ff9b::808:808'])
  expect(isPrivateAddress(ip), ip).toBe(false)
```

I rated this one low because the feature is off by default. It's here because the gap isn't specific to my code: any guard built from IPv4 ranges plus a few IPv6 ones has it.

## 4. Presigned uploads that keep the browser's Content-Type

Big files go from the browser straight to S3 through a presigned PUT URL. The server checks the file name and type, then signs the URL. But S3 stores, and later serves the file with, the `Content-Type` of the browser's PUT. If that header isn't part of the signature, the uploader chooses it. Sent as `text/html`, the file becomes a web page on your bucket's or CDN's domain.

SVG had the same problem from another direction. It was part of the default `image/*`, and an SVG can carry scripts. Files that Easy CMS serves itself get `Content-Security-Policy: sandbox` and `nosniff`, but a public bucket sends neither.

My first fix, in 0.48.0, had two parts. `image/*` no longer includes SVG; you have to list `image/svg+xml` by name. And when a direct upload is completed, the server reads the start of the file and checks two things:

```ts
// packages/core/src/local-api.ts, completeUpload()
const mimeType = sniffMimeType(start.body.subarray(0, SNIFF_BYTES), t.name)
if (mimeType !== t.type)
  await refuse(`contains ${mimeType ?? 'an unknown type'}, not ${t.type}`)
// The browser chose the type the storage serves it with: it must be the one checked.
const served = start.contentType?.split(';')[0]?.trim().toLowerCase()
if (served && served !== t.type) await refuse(`is stored as ${served}, not ${t.type}`)
```

`refuse` deletes the file. The test uploads a real PDF with `text/html; charset=utf-8` and expects `completeUpload` to reject it and leave nothing in storage.

That fix left a gap, which I only found while writing this post. The check runs when the upload is completed. A file that is sent and never completed skips it, and stays in the bucket with the type it was sent with. Easy CMS doesn't delete abandoned uploads (a pending-uploads table would need a migration in every project), so on a public bucket that file was served as whatever the uploader chose. Checking a file when the upload completes isn't enough if the file is already public before that.

The real fix binds the type when signing. It shipped in 1.4.2 ([PR #197](https://github.com/maritonx/easy-cms/pull/197)). The S3 adapter signs with aws4fetch, which leaves `content-type` out of the signature unless you ask for all headers:

```ts
// packages/storage-s3/src/index.ts, uploadURL()
const headers = { 'content-type': contentType }
const signed = await client.sign(url.toString(), {
  method: 'PUT',
  headers,
  aws: { signQuery: true, allHeaders: true },
})
return { url: signed.url, method: 'PUT', headers }
```

`contentType` is the type the server worked out from the file name and checked against the allowed list. The URL now carries `X-Amz-SignedHeaders=content-type;host`, so S3 refuses a PUT with another type, or with none. The new test runs against a real S3-compatible server: a PUT with `text/html` and a PUT with no type are both refused, nothing is stored, and completing the upload fails. Abandoned files can still exist, but only with a type the server allowed.

The Vercel Blob adapter already bound the type with `allowedContentTypes`. With the AWS SDK v3, a `ContentType` on the `PutObjectCommand` becomes a signed header in the same way. Whatever you sign with, look at the signed headers in the URL rather than trusting the option you passed. The review's deploy advice still holds as a second layer: serve a public bucket from a different domain than your app.

## 5. Email links that sign you in more than once

A signed token with an expiry, whether HMAC or JWT, answers "who is this, and is it still valid?" It can't answer "has this been used?" The signature checks out on the second click just as it did on the first.

The email confirmation link for site members also signs them in, and it's valid for 7 days by default. Before the fix, the same link signed you in again and again until it expired. That covers a forwarded email, a shared computer, or browser history.

The fix ties the token to state that the action changes. A confirmation link is accepted only while the account is unconfirmed:

```ts
// packages/core/src/auth/auth.ts, verifyEmail() (excerpt)
if (
  !user ||
  user.active === false ||
  // A link confirms once: it doesn't sign in again afterwards.
  user.emailVerified !== false ||
  !passwordTokenMatches(this.config.secret, token, passwordFingerprint(user.passwordHash))
) {
  // record the failure, answer "This link has expired or is not valid"
}
```

The last line is the same trick used for password reset links. The HMAC covers a fingerprint of the user's current password hash, so a new password invalidates every older link without a table of used tokens. The test is two calls:

```ts
// packages/integration/test/members.test.ts
expect((await call('/auth/verify-email', { method: 'POST', body: { token } })).status).toBe(200)
expect((await call('/auth/verify-email', { method: 'POST', body: { token } })).status).toBe(400)
```

## What I'd check in your app

- **Headers your proxy writes:** which entry you trust, and whether your app is ever reachable without the proxy.
- **Every `request.json()` and `request.text()`:** what stops a body with no length.
- **SSRF blocklists:** run the address table above against yours.
- **Presigned URLs:** which headers are actually in the signature, and what happens to an upload nobody completes.
- **One-time links:** what state makes the second use fail.

The same review also found that a starter template fell back to a fixed secret in production. The core now refuses secrets that look like examples or repeated patterns in production. Every fix listed in the review has a test, and the full list is in [docs/security/asvs-l1.md](https://github.com/maritonx/easy-cms/blob/main/docs/security/asvs-l1.md) (in Thai). The review document plans an external pentest for after 1.0, once there are production users. If you find something before then, please use GitHub's private vulnerability reporting, as described in `SECURITY.md`, rather than a public issue.

---

Easy CMS is MIT-licensed: [github.com/maritonx/easy-cms](https://github.com/maritonx/easy-cms) · [docs](/docs). If you try it, tell me what got in your way in the [feedback issue](https://github.com/maritonx/easy-cms/issues/137).

*I drafted this post with Claude, working from the project's design docs and git history. The decisions, and the mistakes, are mine.*
