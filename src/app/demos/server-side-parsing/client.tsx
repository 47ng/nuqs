'use client'

import Link from 'next/link'
import { parseAsBoolean, useQueryState } from '../../../../dist'
import { counterParser } from './parser'

type Props = {
  serverSideCounter: number
  children: React.ReactNode
}

export function ServerSideParsingDemoClient({
  serverSideCounter,
  children
}: Props) {
  const [shallow, setShallow] = useQueryState(
    'shallow',
    parseAsBoolean.withDefault(true)
  )
  const [counter, setCounter] = useQueryState('counter', {
    ...counterParser,
    shallow
  })

  return (
    <main>
      <Link href="/">⬅️ Home</Link>
      <h1>Server side parsing</h1>
      <div style={{ marginBottom: '1rem' }}>
        <input
          type="checkbox"
          checked={shallow}
          onChange={e => setShallow(e.target.checked)}
          id="shallow"
        />
        <label htmlFor="shallow">Shallow?</label>
      </div>
      <button onClick={() => setCounter(x => x - 1)}>-</button>
      <button onClick={() => setCounter(x => x + 1)}>+</button>
      <button onClick={() => setCounter(null)}>Reset</button>
      <p>Client side counter: {counter}</p>
      <p>
        Server side counter: {serverSideCounter} <em>(client-rendered)</em>
      </p>
      {children}
      <p>
        <em>
          Check the server console, play with the "shallow" switch and try
          refreshing the page.
        </em>
      </p>
    </main>
  )
}
