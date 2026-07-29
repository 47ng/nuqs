'use client'

import { parseAsInteger, useQueryState } from 'nuqs'
import { useEffect, useRef, useTransition } from 'react'

export function Repro1506() {
  const [isPending, startTransition] = useTransition()
  const [count, setCount] = useQueryState(
    'count',
    parseAsInteger.withDefault(0)
  )
  const renderLog = useRef<HTMLOutputElement>(null)

  useEffect(() => {
    const output = renderLog.current
    if (output) {
      output.value = output.value ? `${output.value},${count}` : String(count)
    }
  }, [count])

  return (
    <main>
      <button
        disabled={isPending}
        onClick={() => {
          startTransition(() => {
            setCount(current => current + 1)
          })
        }}
      >
        {isPending ? 'Pending' : 'Increment'}
      </button>
      <p>
        Count: <output aria-label="Count">{count}</output>
      </p>
      <p>
        Committed values:{' '}
        <output ref={renderLog} aria-label="Committed values" />
      </p>
    </main>
  )
}
