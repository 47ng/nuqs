'use client'

import { Button } from '@/src/components/ui/button'
import { Minus, Plus } from 'lucide-react'
import { parseAsInteger, useQueryState } from 'nuqs'

export default function BasicCounterDemoPage() {
  const [counter, setCounter] = useQueryState(
    'counter',
    parseAsInteger.withDefault(0)
  )
  return (
    <>
      <nav className="mb-4 flex flex-wrap items-center gap-4">
        <Button onClick={() => setCounter(x => x - 1)}>
          <Minus />
        </Button>
        <Button onClick={() => setCounter(x => x + 1)}>
          <Plus />
        </Button>
        <Button onClick={() => setCounter(null)}>Reset</Button>
        <span className="text-2xl font-semibold tabular-nums">
          Counter: {counter}
        </span>
      </nav>
    </>
  )
}
