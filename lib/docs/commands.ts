// Copied from create-easy-cms (packages/create-easy-cms/src/commands.ts in maritonx/easy-cms) so the
// docs show every npm command for pnpm, Yarn and Bun the same way the scaffolder prints them.

/**
 * Commands in each package manager's own words. No Node APIs: the docs site uses this too, to
 * show every `npm`/`npx` command for pnpm, Yarn and Bun.
 */

export const PACKAGE_MANAGERS = ['npm', 'pnpm', 'yarn', 'bun'] as const
export type PackageManager = (typeof PACKAGE_MANAGERS)[number]

export const isPackageManager = (value: unknown): value is PackageManager =>
  typeof value === 'string' && (PACKAGE_MANAGERS as readonly string[]).includes(value)

/** Adds packages, as dependencies or devDependencies. */
export function installArgs(pm: PackageManager, packages: readonly string[], dev: boolean) {
  const add = pm === 'npm' ? 'install' : 'add'
  const devFlag = pm === 'npm' ? '--save-dev' : pm === 'bun' ? '--dev' : '-D'
  return [add, ...(dev ? [devFlag] : []), ...packages]
}

/** Runs a package.json script: `npm run dev`, `pnpm dev`, `yarn dev`, `bun run dev`. */
export function runScript(pm: PackageManager, script: string, args = ''): string {
  const rest = args ? ` ${args}` : ''
  if (pm === 'npm') return `npm run ${script}${args ? ` --${rest}` : ''}`
  // `bun <name>` can mean one of Bun's own commands (`bun test`, `bun build`).
  if (pm === 'bun') return `bun run ${script}${rest}`
  return `${pm} ${script}${rest}`
}

/** Runs a binary installed in the project: `npx easy-cms migrate`, `pnpm exec easy-cms migrate`… */
export function execBin(pm: PackageManager, command: string): string {
  if (pm === 'npm') return `npx ${command}`
  if (pm === 'pnpm') return `pnpm exec ${command}`
  if (pm === 'yarn') return `yarn ${command}`
  // bunx runs the binary with Node (its shebang) unless --bun is given.
  return `bunx ${command}`
}

/** Runs a package without installing it, e.g. `npx nuxi init`. */
export function dlx(pm: PackageManager, command: string): string {
  if (pm === 'npm') return `npx ${command}`
  if (pm === 'pnpm') return `pnpm dlx ${command}`
  if (pm === 'yarn') return `yarn dlx ${command}`
  return `bunx ${command}`
}

/** `npm create easy-cms@latest my-cms` → `pnpm create easy-cms my-cms`… */
export function createCommand(pm: PackageManager, initializer: string, args = ''): string {
  const rest = args ? ` ${args}` : ''
  if (pm === 'npm') return `npm create ${initializer}${rest}`
  return `${pm} create ${initializer.replace(/@latest$/, '')}${rest}`
}

/** Binaries that are installed in an Easy CMS project, so `npx` runs the local one. */
const LOCAL_BINS = new Set(['easy-cms', 'nuxi', 'nuxt', 'next', 'drizzle-kit', 'vitest', 'tsx'])

/**
 * One line of an `npm`/`npx` command in another package manager's words. Lines that aren't
 * npm commands (comments, `cd`, environment variables before a command…) are kept; `null`
 * when the line has an npm command this does not know.
 */
export function translateLine(line: string, pm: PackageManager): string | null {
  if (pm === 'npm') return line
  // Keep leading environment variables and indentation: `NODE_ENV=production npm start`.
  const match = /^(\s*(?:[A-Z_][A-Z0-9_]*=\S*\s+)*)(.*)$/.exec(line) as RegExpExecArray
  const prefix = match[1] as string
  const body = match[2] as string
  // A comment after the command stays, after the translated command.
  const at = body.search(/\s+#/)
  const command = (at >= 0 ? body.slice(0, at) : body).trim()
  const comment = at >= 0 ? body.slice(at) : ''
  // `cd my-cms && npm run dev`: each command of the chain.
  const parts = command.split(/\s+&&\s+/).map((part) => [part, translateCommand(part, pm)] as const)
  if (parts.every(([, t]) => t === undefined)) return line
  if (parts.some(([, t]) => t === null)) return null
  return `${prefix}${parts.map(([part, t]) => t ?? part).join(' && ')}${comment}`
}

/** `undefined`: not an npm command, keep it; `null`: an npm command this does not know. */
function translateCommand(command: string, pm: PackageManager): string | null | undefined {
  const words = command.split(/\s+/)
  const [tool, sub, ...rest] = words
  if (tool === 'npx') {
    const [bin = '', ...args] = words.slice(1).filter((w) => w !== '-y' && w !== '--yes')
    const name = bin.replace(/@[^/@]*$/, '')
    const tail = args.join(' ')
    if (name.startsWith('create-')) return createCommand(pm, name.slice('create-'.length), tail)
    const full = [name, ...args].join(' ')
    return LOCAL_BINS.has(name) ? execBin(pm, full) : dlx(pm, [bin, ...args].join(' '))
  }
  if (tool !== 'npm' || sub === undefined) return undefined
  const args = rest.join(' ')
  switch (sub) {
    case 'create':
    case 'init': {
      const [initializer = '', ...more] = rest
      return createCommand(pm, initializer, more.join(' '))
    }
    case 'install':
    case 'i':
    case 'add': {
      if (rest.length === 0) return `${pm} install`
      const dev = rest.some((w) => w === '-D' || w === '--save-dev')
      const packages = rest.filter((w) => w !== '-D' && w !== '--save-dev')
      if (packages.some((p) => p.startsWith('-'))) return null
      return [pm, ...installArgs(pm, packages, dev)].join(' ')
    }
    case 'ci':
      if (rest.length > 0) return null
      return pm === 'yarn' ? 'yarn install --immutable' : `${pm} install --frozen-lockfile`
    case 'uninstall':
    case 'remove':
      return `${pm} remove ${args}`
    case 'run': {
      const [script = '', ...more] = rest
      const passed = more[0] === '--' ? more.slice(1) : more
      return runScript(pm, script, passed.join(' '))
    }
    case 'start':
    case 'test':
      return runScript(pm, sub, args)
    case 'exec':
      return execBin(pm, (rest[0] === '--' ? rest.slice(1) : rest).join(' '))
    default:
      return null
  }
}

/** A whole shell snippet in another package manager's words; `null` if any line can't be. */
export function translateCommands(code: string, pm: PackageManager): string | null {
  const lines = code.split('\n').map((line) => translateLine(line, pm))
  return lines.includes(null) ? null : lines.join('\n')
}
