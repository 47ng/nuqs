'use client'

import { parseAsString, useQueryState } from 'nuqs'
import { startTransition, useLayoutEffect, useRef, useState } from 'react'

const renderLimit = 60

export function LanePriority() {
  const [value, setValue] = useQueryState('value', parseAsString)
  const [, setMeasured] = useState<string | null>(null)
  const [, setTick] = useState(0)
  const renderCount = useRef(0)
  const renderedValues = useRenderLog(value)

  useLayoutEffect(() => {
    renderCount.current++
    if (renderCount.current < renderLimit) {
      setMeasured(value)
    }
  }, [value])

  return (
    <main>
      <button
        data-testid="write"
        onClick={() => {
          startTransition(() => {
            setValue('B')
          })
        }}
      >
        Write in transition
      </button>
      <button data-testid="tick" onClick={() => setTick(tick => tick + 1)}>
        Urgent update
      </button>
      <p>
        Value: <output aria-label="Value">{String(value)}</output>
      </p>
      <p>
        Rendered values:{' '}
        <output aria-label="Rendered values">
          {renderedValues.map(String).join(',')}
        </output>
      </p>
    </main>
  )
}

function useRenderLog(value: string | null) {
  'use no memo'
  // Intentionally records render-phase values, including renders React abandons.
  // Keep this side effect isolated from the compiled component.
  const renderedValues = useRef<Array<string | null>>([])
  renderedValues.current.push(value)
  return [...renderedValues.current]
}
