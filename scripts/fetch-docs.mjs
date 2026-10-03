/**
 * Brings the docs from the Easy CMS repository, where they are written next to the code:
 * website/guide, website/reference, website/th, website/sidebar.json and the admin screenshots.
 * They land in content/docs and public/screenshots, which are not committed here.
 *
 * Which version:
 *   DOCS_SOURCE=../EasyCMS   a local checkout, for writing docs and seeing them here
 *   DOCS_REF=main            a branch, tag or commit of maritonx/easy-cms
 *   (neither)                the commit @easy-cms/core@latest was published from, read from its
 *                            npm provenance, so the docs match what `npm install` gives you
 *
 *   node scripts/fetch-docs.mjs [--if-missing]
 */
import { execFileSync } from 'node:child_process'
import { cp, mkdir, mkdtemp, readdir, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

const REPO = 'maritonx/easy-cms'
const PACKAGE = '@easy-cms/core'
const root = path.resolve(import.meta.dirname, '..')
const contentDir = path.join(root, 'content/docs')
const screenshotsDir = path.join(root, 'public/screenshots')

const exists = (p) => stat(p).then(() => true, () => false)

if (process.argv.includes('--if-missing') && (await exists(path.join(contentDir, 'sidebar.json')))) {
  process.exit(0)
}

async function getJSON(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${url}: ${res.status} ${res.statusText}`)
  return res.json()
}

/** The git commit npm's provenance says the latest release was built from. */
async function releasedCommit() {
  const { version } = await getJSON(`https://registry.npmjs.org/${PACKAGE}/latest`)
  const { attestations } = await getJSON(
    `https://registry.npmjs.org/-/npm/v1/attestations/${encodeURIComponent(PACKAGE)}@${version}`,
  )
  for (const { bundle } of attestations) {
    const statement = JSON.parse(Buffer.from(bundle.dsseEnvelope.payload, 'base64').toString())
    const commit = statement.predicate?.buildDefinition?.resolvedDependencies?.[0]?.digest?.gitCommit
    if (commit) return { ref: commit, version }
  }
  throw new Error(`${PACKAGE}@${version} has no provenance with a git commit; set DOCS_REF`)
}

/** Downloads and unpacks the repository at `ref`; returns its website/ directory. */
async function download(ref) {
  const dir = await mkdtemp(path.join(tmpdir(), 'easy-cms-docs-'))
  const res = await fetch(`https://codeload.github.com/${REPO}/tar.gz/${ref}`)
  if (!res.ok) throw new Error(`Could not download ${REPO}@${ref}: ${res.status}`)
  const archive = path.join(dir, 'repo.tar.gz')
  await writeFile(archive, Buffer.from(await res.arrayBuffer()))
  execFileSync('tar', ['-xzf', archive, '-C', dir])
  const [top] = (await readdir(dir, { withFileTypes: true })).filter((e) => e.isDirectory())
  return { website: path.join(dir, top.name, 'website'), cleanup: () => rm(dir, { recursive: true }) }
}

let source
if (process.env.DOCS_SOURCE) {
  const website = path.resolve(root, process.env.DOCS_SOURCE, 'website')
  source = { website, label: `local ${website}`, ref: 'local', version: null, cleanup: async () => {} }
} else {
  const { ref, version } = process.env.DOCS_REF
    ? { ref: process.env.DOCS_REF, version: null }
    : await releasedCommit()
  const { website, cleanup } = await download(ref)
  source = { website, label: `${REPO}@${ref}${version ? ` (${PACKAGE}@${version})` : ''}`, ref, version, cleanup }
}

try {
  if (!(await exists(path.join(source.website, 'sidebar.json')))) {
    throw new Error(
      `${source.label} has no website/sidebar.json (added in the docs/shared-sidebar branch of ` +
        `${REPO}). Set DOCS_REF to a branch or commit that has it, or DOCS_SOURCE to a local checkout.`,
    )
  }
  await rm(contentDir, { recursive: true, force: true })
  await rm(screenshotsDir, { recursive: true, force: true })
  await mkdir(path.join(contentDir, 'en'), { recursive: true })
  await cp(path.join(source.website, 'guide'), path.join(contentDir, 'en/guide'), { recursive: true })
  await cp(path.join(source.website, 'reference'), path.join(contentDir, 'en/reference'), { recursive: true })
  await cp(path.join(source.website, 'th'), path.join(contentDir, 'th'), { recursive: true })
  await cp(path.join(source.website, 'sidebar.json'), path.join(contentDir, 'sidebar.json'))
  await cp(path.join(source.website, 'public/screenshots'), screenshotsDir, { recursive: true })
  await writeFile(
    path.join(contentDir, 'source.json'),
    `${JSON.stringify({ repo: REPO, ref: source.ref, version: source.version, fetchedAt: new Date().toISOString() }, null, 2)}\n`,
  )
  console.log(`Docs from ${source.label}`)
} finally {
  await source.cleanup()
}
