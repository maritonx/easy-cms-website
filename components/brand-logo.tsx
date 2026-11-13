/**
 * Product logos in public/logos: full-colour icons (CC0) and Simple Icons marks (CC0) in their
 * brand colour. The footer notes that the names and logos are their owners' trademarks.
 */
export const BRANDS = {
  nodejs: 'Node.js',
  bun: 'Bun',
  deno: 'Deno',
  cloudflareworkers: 'Cloudflare Workers',
  nextjs: 'Next.js',
  nuxt: 'Nuxt',
  sqlite: 'SQLite',
  turso: 'Turso',
  postgresql: 'PostgreSQL',
  vercel: 'Vercel',
  docker: 'Docker',
  claude: 'Claude',
  cursor: 'Cursor',
  copilot: 'GitHub Copilot',
} as const

export type Brand = keyof typeof BRANDS

/** A logo on a white tile; with `label`, the product's name beside it (and an empty alt). */
export function BrandLogo({ name, label = false }: { name: Brand; label?: boolean }) {
  const img = (
    <span className="logo">
      {/* eslint-disable-next-line @next/next/no-img-element -- small static SVGs */}
      <img src={`/logos/${name}.svg`} alt={label ? '' : BRANDS[name]} width={20} height={20} loading="lazy" />
    </span>
  )
  if (!label) return img
  return (
    <span className="brandchip">
      {img}
      {BRANDS[name]}
    </span>
  )
}
