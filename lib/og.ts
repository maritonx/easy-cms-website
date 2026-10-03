import 'server-only'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

const files = path.join(process.cwd(), 'node_modules/@fontsource/ibm-plex-sans-thai/files')

/**
 * IBM Plex Sans Thai (Latin and Thai) for share images: ImageResponse needs font files, and WOFF
 * because it can't read WOFF2. Read at build time, where the images are rendered.
 */
export async function ogFonts() {
  const font = async (subset: 'latin' | 'thai', weight: 500 | 700) => ({
    name: 'Plex',
    data: await readFile(path.join(files, `ibm-plex-sans-thai-${subset}-${weight}-normal.woff`)),
    weight,
    style: 'normal' as const,
  })
  return Promise.all([font('latin', 500), font('latin', 700), font('thai', 500), font('thai', 700)])
}
