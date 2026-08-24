'use client'

import { parseAsString, useQueryState } from 'nuqs'
import { startTransition, useLayoutEffect, useRef, useState } from 'react'

const renderLimit = 60

export function LanePriority() {
  const [value, setValue] = useQueryState('value', parseAsString)
  const [, setMeasured] = useState<string | null>(null)
  const [, setTick] = useState(0)
  const renderCount = useRef(0)
  const renderedValues = useRef<Array<string | null>>([])

  renderCount.current++
  const previous = renderedValues.current[renderedValues.current.length - 1]
  if (!Object.is(previous, value)) {
    renderedValues.current.push(value)
  }

  useLayoutEffect(() => {
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
          {renderedValues.current.map(String).join(',')}
        </output>
      </p>
    </main>
  )
}
