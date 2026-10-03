'use client'

import { useRef, useState } from 'react'
import { CopyIcon } from '@/components/icons'
import { copyText, PACKAGE_MANAGERS, setPackageManager, usePackageManager } from '@/lib/package-manager'

const CREATE = {
  npm: 'npm create easy-cms@latest',
  pnpm: 'pnpm create easy-cms',
  yarn: 'yarn create easy-cms',
  bun: 'bun create easy-cms',
} as const

export function InstallCommand() {
  const pm = usePackageManager()
  const [label, setLabel] = useState('Copy')
  const codeRef = useRef<HTMLElement>(null)

  async function copy() {
    setLabel(await copyText(CREATE[pm], codeRef.current))
    setTimeout(() => setLabel('Copy'), 1600)
  }

  return (
    <div className="installer">
      <div className="pm-tabs" role="tablist" aria-label="Package manager">
        {PACKAGE_MANAGERS.map((name) => (
          <button
            key={name}
            role="tab"
            aria-selected={name === pm}
            onClick={() => setPackageManager(name)}
          >
            {name}
          </button>
        ))}
      </div>
      <div className="install-line">
        <span className="prompt">$</span>
        <code ref={codeRef}>{CREATE[pm]}</code>
        <button className="copy-btn" type="button" onClick={copy}>
          <CopyIcon />
          <span>{label}</span>
        </button>
      </div>
    </div>
  )
}
