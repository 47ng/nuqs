'use client'

import Link from 'next/link'
import React from 'react'
import {
  parseAsInteger,
  subscribeToQueryUpdates,
  useQueryState
} from '../../../../dist'

export default function BuilderPatternDemoPage() {
  const [counter, setCounter] = useQueryState(
    'counter',
    parseAsInteger.withDefault(0)
  )

  React.useEffect(() => {
    const off = subscribeToQueryUpdates(search =>
      console.log(search.toString())
    )
    return off
  }, [])

  return (
    <main>
      <Link href="/">⬅️ Home</Link>
      <h1>subscribeToQueryUpdates</h1>
      <button onClick={() => setCounter(x => x - 1)}>-</button>
      <button onClick={() => setCounter(x => x + 1)}>+</button>
      <button onClick={() => setCounter(null)}>Reset</button>
      <p>{counter}</p>
      <p>
        <em>Check the console</em>
      </p>
    </main>
  )
}
