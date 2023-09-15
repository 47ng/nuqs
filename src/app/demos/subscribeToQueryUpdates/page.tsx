'use client'

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
    const off = subscribeToQueryUpdates(({ search }) =>
      console.log(search.toString())
    )
    return off
  }, [])

  return (
    <>
      <h1>Subscribing to query updates</h1>
      <button onClick={() => setCounter(x => x - 1)}>-</button>
      <button onClick={() => setCounter(x => x + 1)}>+</button>
      <button onClick={() => setCounter(null)}>Reset</button>
      <p>{counter}</p>
      <p>
        <em>Check the console</em>
      </p>
      <p>
        <a href="https://github.com/47ng/next-usequerystate/blob/next/src/app/demos/subscribeToQueryUpdates/page.tsx">
          Source on GitHub
        </a>
      </p>
    </>
  )
}
