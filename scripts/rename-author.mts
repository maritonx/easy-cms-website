// One-off (2026-11): posts written before the maintainer's name was spelled "Kanawut K." keep the
// old spelling in `author`. Dry run by default; `--apply` saves. Against Turso:
//   NODE_ENV=production node --env-file-if-exists=.env --env-file=.env.turso --import tsx scripts/rename-author.mts --apply
import { createEasyCMS } from '@easy-cms/core'
import configModule from '../easy-cms.config'

const FROM = 'Kanawoot K.'
const TO = 'Kanawut K.'
const apply = process.argv.includes('--apply')
const config = ((configModule as { default?: unknown }).default ?? configModule) as Parameters<
  typeof createEasyCMS
>[0]
const cms = await createEasyCMS(config)

// The live documents first, leaving pending drafts as they are…
const live = await cms.find('posts', { where: { author: { equals: FROM } }, limit: 1000 })
// …then the drafts (a pending draft, or a post never published).
const drafts = await cms.find('posts', {
  where: { author: { equals: FROM } },
  limit: 1000,
  draft: true,
})
console.log(`live: ${live.docs.length}, drafts: ${drafts.docs.length}${apply ? '' : ' (dry run: add --apply to save)'}`)
if (apply) {
  for (const doc of live.docs) await cms.update('posts', doc.id, { author: TO } as never, { live: true })
  // Read again: a draft that was the live document is done already.
  const left = await cms.find('posts', { where: { author: { equals: FROM } }, limit: 1000, draft: true })
  for (const doc of left.docs) await cms.update('posts', doc.id, { author: TO } as never)
  const remaining = await cms.count('posts', { where: { author: { equals: FROM } }, draft: true })
  console.log(`saved: ${live.docs.length} live, ${left.docs.length} drafts; still "${FROM}": ${remaining}`)
}
await cms.destroy()
