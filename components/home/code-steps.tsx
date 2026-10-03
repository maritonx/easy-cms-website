'use client'

import { useState } from 'react'

export type CodeStep = {
  key: string
  title: string
  text: React.ReactNode
  file: string
  /** Highlighted on the server. */
  html: string
}

export function CodeSteps({ steps }: { steps: CodeStep[] }) {
  const [active, setActive] = useState(steps[0]?.key)
  return (
    <div className="codefirst">
      <ol className="steps" role="tablist" aria-label="Setup steps">
        {steps.map((step) => (
          <li key={step.key}>
            <button role="tab" aria-selected={step.key === active} onClick={() => setActive(step.key)}>
              <b>{step.title}</b>
              <span>{step.text}</span>
            </button>
          </li>
        ))}
      </ol>
      <div className="editor">
        <div className="editor-tabs" role="tablist" aria-label="Files">
          {steps.map((step) => (
            <button key={step.key} role="tab" aria-selected={step.key === active} onClick={() => setActive(step.key)}>
              {step.file}
            </button>
          ))}
        </div>
        {steps.map((step) => (
          <div
            key={step.key}
            className="panel"
            role="tabpanel"
            hidden={step.key !== active}
            dangerouslySetInnerHTML={{ __html: step.html }}
          />
        ))}
      </div>
    </div>
  )
}
