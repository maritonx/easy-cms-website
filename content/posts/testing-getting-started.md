---
title: "Testing your Getting Started like a stranger: Verdaccio and a clean Ubuntu"
slug: testing-getting-started
language: en
category: Engineering
publishedAt: 2026-11-30
coverText: "npm · pnpm · bun"
excerpt: "CI with workspace links can't tell you what a stranger gets from npm. A local registry, four package managers and a fresh container can."
---
The first two minutes of an open-source tool are the product. Someone reads your README, types one command, and either sees something working or closes the tab. They don't file an issue. They just leave.

And those two minutes are the part your CI is worst at testing.

In a monorepo, CI installs the workspace. Packages point at each other through `workspace:^` links, the pnpm store is warm, and the repo's own `.npmrc` and `package.json` are in scope. Everything a stranger never has. A green CI run tells you the code works. It doesn't tell you what `npm create your-thing@latest` does on someone else's laptop, with their package manager, from the registry.

[TODO: your story — the first time a fresh install broke for someone, or for you, while CI was green]

This post is how [Easy CMS](https://github.com/maritonx/easy-cms), a CMS that installs into a Nuxt or Next.js app ([the first post in this series](FIRST_POST_URL) introduces it), tests that path. Its Getting Started is one command: `npm create easy-cms@latest`.

## Two tests, two different questions

| | Smoke test | Canary |
|---|---|---|
| Question | Does *this commit* install like a release would? | Does *the release on npm* work, following the guide word for word? |
| Packages from | This commit, published to a local registry | npmjs, a dist-tag (`latest` or `rc`) |
| Package managers | npm, pnpm, Yarn 1, Yarn stable, Bun | npm |
| Machine | GitHub runners (Ubuntu, Windows) | A fresh `ubuntu:26.04` container |
| Project | Standalone server | Standalone, Next.js and Nuxt |
| When | Every pull request | By hand, against `latest` or `rc` |

![The smoke test publishes the commit to Verdaccio and scaffolds with five package managers on Ubuntu and Windows; the canary installs the release from npm in a fresh Ubuntu 26.04 container](/images/blog/testing-getting-started/diagram-1.png)

The smoke test is cheap enough to run on every PR. The canary is slower and closer to the truth.

## Step 1: publish this commit to a local registry

[Verdaccio](https://verdaccio.org/) is a small npm registry you can run in a CI job. The config does one important thing: the project's own packages are served *only* from Verdaccio, and everything else comes from npmjs.

```yaml
# smoke/verdaccio.yaml (excerpt)
uplinks:
  npmjs:
    url: https://registry.npmjs.org/
packages:
  '@easy-cms/*':
    access: $all
    publish: $authenticated
  # easy-cms and create-easy-cms: the same, no proxy
  '**':
    access: $all
    proxy: npmjs
```

No `proxy` on `@easy-cms/*` means Verdaccio can't fall back to the released version. If the commit's package is missing, the install fails.

Then `smoke/publish.ts` publishes every public package. Two details matter. It uses `pnpm publish`, which turns `workspace:^` into a real `^1.13.0` range, the same as the real release. And it picks a version that doesn't exist on npmjs:

```ts
// smoke/publish.ts (excerpt)
// A version npmjs doesn't have, so a package manager that reads another registry fails instead
// of quietly installing the released packages.
const version = `${base}-smoke.${Date.now()}`
```

That second detail exists because of a bug in the test itself, which I'll get to.

## Step 2: scaffold like a user, with each package manager

`smoke/scaffold.ts` creates an empty temp directory and runs the command a user would run: `npm create easy-cms@latest -- my-cms --yes`, `pnpm create easy-cms my-cms --yes`, and the same for Yarn and Bun. Most of the work is in the environment it runs them with:

```ts
// smoke/scaffold.ts (excerpt)
const env: NodeJS.ProcessEnv = {
  ...process.env,
  npm_config_registry: REGISTRY,
  NPM_CONFIG_REGISTRY: REGISTRY,
  BUN_CONFIG_REGISTRY: REGISTRY,
  YARN_NPM_REGISTRY_SERVER: REGISTRY, // Yarn 2+
  YARN_REGISTRY: REGISTRY, // Yarn 1, which reads neither npm_config_registry nor a parent .npmrc
  YARN_UNSAFE_HTTP_WHITELIST: 'localhost',
  YARN_ENABLE_IMMUTABLE_INSTALLS: 'false',
  YARN_ENABLE_GLOBAL_CACHE: 'false',
  // Yarn 4.10+ waits a day before installing a new version; these were published a minute ago.
  YARN_NPM_MINIMAL_AGE_GATE: '0',
  npm_config_user_agent: undefined,
  // Fresh caches: package lists cached from an earlier run would miss this run's versions.
  npm_config_cache: join(root, '.cache', 'npm'),
  BUN_INSTALL_CACHE_DIR: join(root, '.cache', 'bun'),
  npm_config_store_dir: join(root, '.cache', 'pnpm'),
}
```

Each line is a lesson. The ones worth knowing even if you never use Easy CMS:

**Yarn 1 ignores `npm_config_registry`.** It also ignores an `.npmrc` in a parent folder. It reads `YARN_REGISTRY`. Without it, Yarn 1 quietly installed the released packages from npmjs, and the test passed without testing this commit. It only failed when CI happened to run while a release was going out. I learned this right after the 0.22 releases that added package-manager support. That's why the version now ends in `-smoke.<timestamp>`: after installing, the script reads `node_modules/@easy-cms/core/package.json` and fails unless the version matches. A package manager that reads the wrong registry now fails loudly.

**Yarn 4.10+ won't install anything published less than a day ago.** The setting is `npmMinimalAgeGate`, and it's a good default against supply-chain attacks. But in a smoke test, every package was published a minute ago, so the test turns it off. Your users keep it.

**Caches lie.** A package-list cache from a previous run doesn't know about this run's version. Each run gets its own npm cache, pnpm store and Bun cache.

**The parent process leaks.** `create-easy-cms` picks the package manager from `--pm`, then the `packageManager` field, then a lockfile, then `npm_config_user_agent`. The script clears that variable, so only the tool that runs `create` sets it, as on a user's machine. Then it checks the result: a `pnpm-lock.yaml` for pnpm, a `yarn.lock` for Yarn, a `bun.lock` for Bun.

**Yarn 1 can't create from a tag.** `yarn create easy-cms@rc` looks for a binary literally named `create-easy-cms@rc`. To test a release candidate with Yarn 1, the script uses `npx create-easy-cms@rc --pm yarn`, which is also what a Yarn 1 user would have to do.

**Corepack refuses to run Yarn inside a pnpm repo.** The repo's `package.json` declares pnpm, so the CI job checks the Yarn version from the runner's temp directory instead.

There's also a thing the test deliberately *doesn't* do: it never writes `.yarnrc.yml`. With Yarn 2 or later, `create-easy-cms` is supposed to write `nodeLinker: node-modules` itself, because Plug'n'Play doesn't fully work with native binaries like libsql or with the frameworks. If the test wrote it, it would hide a broken scaffold.

After the install, the script runs the next steps the CLI printed, in that package manager's own words (`npx easy-cms migrate`, `pnpm exec easy-cms migrate`, `yarn easy-cms migrate`, `bunx easy-cms migrate`). It creates an admin, starts the production server on a port the OS says is free (a random one could collide with Verdaccio on 4873), and waits for `/healthz`. Then it asks `/api/cms/auth/init` whether an admin exists.

When a step fails, the last 20 lines of output go into a GitHub error annotation, because annotations are public and job logs need a login. The matrix runs npm, pnpm, Yarn stable, Yarn 1.22.22 and Bun on Ubuntu, and npm and pnpm on Windows.

## Step 3: the canary, in a container nobody has touched

The smoke test still runs on a GitHub runner, which has Node, Git and a preinstalled Yarn. And it tests the standalone server, not the Next.js and Nuxt paths most people take. So the release gets one more test: `canary/run.sh`.

On the host, the script starts a clean container and runs itself inside it:

```bash
# canary/run.sh (excerpt)
if [ ! -f /.dockerenv ]; then
  exec docker run --rm -e NODE_FROM="$NODE" -e EASY_CMS_TAG="$TAG" \
    -v "$(cd "$(dirname "$0")" && pwd)/run.sh:/canary.sh:ro" \
    "$IMAGE" bash /canary.sh "$IMAGE" "$NODE"
fi
```

Inside `ubuntu:26.04` it installs only `curl`, `ca-certificates` and `git`, then Node 24 from NodeSource (or Ubuntu's own `nodejs` package, with `apt`). Then it follows Getting Started three times, with the packages from npm:

1. **Standalone:** `npm create easy-cms@latest my-cms -- --yes`, then `npm run dev`.
2. **Next.js:** `npx create-next-app@latest`, then `npx create-easy-cms`.
3. **Nuxt:** `npm create nuxt@latest`, then `npx create-easy-cms`.

For each one it checks that `/admin` answers 200 and asks for the first admin. It creates that admin, publishes a post through the REST API (with the session cookie and CSRF token, like the browser would), and reads it back. Then it pastes the guide's "Read content" code into the app *word for word* and checks that the page shows the post. If the docs drift from the code, the canary fails.

A fresh container shows things a developer laptop never does:

- **New Nuxt apps start a Git repository.** A bare Ubuntu has no `git`, so the script installs it.
- **Nuxt answers 503 while it starts**, so "the server is up" means "anything but 5xx", not "port open".
- **`create-next-app` may put the app in `src/app`**, so the script checks where the page goes.
- **Nuxt needs Node 22.19**, newer than Easy CMS's own 22.12 floor. The guide says both.
- **Ubuntu 26.04's own `nodejs` package comes with npm 9.2,** and with npm 9 `npm create nuxt` stops with `Cannot read properties of null (reading 'edgesOut')`.

That last one isn't an Easy CMS bug, and I can't fix it. But it happens in the stranger's first two minutes, on the newest Ubuntu, before my code even runs. So the Getting Started page has a warning box near the top: check `npm --version`, and update npm or install Node from NodeSource or nvm.

The canary isn't in CI yet. I run it by hand, against `latest` or a tag (`EASY_CMS_TAG=rc canary/run.sh`). 1.0 went out after it passed on Ubuntu 26.04. Separately, the main test matrix uses `ubuntu-latest` instead of a pinned image, so a new Ubuntu breaks one job first instead of the release.

## The other stranger: last month's user

An existing user has a different first two minutes: the upgrade. `upgrade/run.ts` fills a database with releases 0.10, 0.20, 0.35, 0.48 and the latest on npm, then migrates and reads it with the current commit, on SQLite and Postgres, in every CI run.

## What this still doesn't cover

- Yarn Plug'n'Play and the Bun runtime. Bun works as a package manager; the CMS still runs on Node.
- The smoke test only scaffolds the standalone server. The Next.js and Nuxt paths are only in the canary, and only with npm.
- No macOS in the smoke matrix.
- Commands written inline in the docs (not in a command block) are still npm-only.

## A checklist for your own CLI or template

None of this is specific to Easy CMS. If your project has an `npm create` or `npx` entry point:

1. **Install from a registry, not from links.** Publish the commit to Verdaccio with the tool your release uses.
2. **Don't proxy your own packages.** A missing package should fail, not fall back to the last release.
3. **Publish a version npmjs doesn't have** (`x.y.z-smoke.<timestamp>`) and assert the installed version.
4. **Set the registry for each package manager separately.** Yarn 1 needs `YARN_REGISTRY`; Yarn 2+ needs `YARN_NPM_REGISTRY_SERVER`; Bun needs `BUN_CONFIG_REGISTRY` or an `.npmrc`.
5. **Turn off Yarn's minimal age gate in the test only.**
6. **Use fresh caches** on every run.
7. **Clear inherited env** like `npm_config_user_agent`, and check the lockfile you expected was written.
8. **Run the next steps you print**, in each package manager's syntax.
9. **Run the README in a container nobody has touched**, with the published packages, and paste the docs' code in verbatim.
10. **Put failures where people look.** A PR annotation beats a log behind a login.

The scripts are small and MIT-licensed: [`smoke/`](https://github.com/maritonx/easy-cms/tree/main/smoke) and [`canary/run.sh`](https://github.com/maritonx/easy-cms/blob/main/canary/run.sh). Copy what's useful.

[TODO: your story — one line on what you'd add to the canary next, or a gotcha readers hit that this misses]

---

Easy CMS is MIT-licensed: [github.com/maritonx/easy-cms](https://github.com/maritonx/easy-cms) · [docs](/docs). If you try it, tell me what got in your way in the [feedback issue](https://github.com/maritonx/easy-cms/issues/137).

*I drafted this post with Claude, working from the project's design docs and git history. The decisions, and the mistakes, are mine.*
