/**
 * Behind the hero's admin window: circuit lines from the one config file out to the parts of a
 * backend it gives you, each ending in a labelled node, with a light running along each line.
 * Decorative; the hero's words say the same thing. The lights stop under reduced motion.
 */
const NODES = [
  { label: 'Sign-in', x: 150, y: -30, d: 'M300 230 H150 V-30' },
  { label: 'Database', x: 300, y: -30, d: 'M300 230 V-30' },
  { label: 'Jobs', x: 450, y: -30, d: 'M300 230 H450 V-30' },
  { label: 'Files', x: 650, y: 170, d: 'M300 230 H520 V170 H650' },
  { label: 'REST · GraphQL', x: 640, y: 360, d: 'M300 230 H500 V360 H640' },
  { label: 'Admin', x: 420, y: 500, d: 'M300 230 V420 H420 V500' },
] as const

const W = 600
const H = 460

export function HeroNet() {
  return (
    <div className="hero-net" aria-hidden="true">
      <svg viewBox={`0 0 ${W} ${H}`} overflow="visible" preserveAspectRatio="xMidYMid meet">
        <defs>
          <radialGradient id="hn-dot">
            <stop offset="0" stopColor="#c8f0e1" />
            <stop offset="1" stopColor="#6fbfa5" stopOpacity="0" />
          </radialGradient>
        </defs>
        {NODES.map((n, i) => (
          <g key={n.label}>
            <path d={n.d} className="hn-line" />
            <circle cx={n.x} cy={n.y} r="4" className="hn-end" />
            <circle r="5" className="hn-pulse" fill="url(#hn-dot)">
              <animateMotion dur={`${3.2 + i * 0.45}s`} begin={`${i * 0.6}s`} repeatCount="indefinite" path={n.d} />
            </circle>
          </g>
        ))}
      </svg>
      {NODES.map((n) => (
        <span key={n.label} className="hn-chip" style={{ left: `${(n.x / W) * 100}%`, top: `${(n.y / H) * 100}%` }}>
          {n.label}
        </span>
      ))}
    </div>
  )
}
