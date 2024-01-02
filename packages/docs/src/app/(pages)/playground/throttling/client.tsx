'use client'

import { useQueryState } from 'next-usequerystate'
import { useRouter } from 'next/navigation'
import React from 'react'
import { delayParser, queryParser } from './parsers'

const autoFillMessage = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a diam lectus. Sed sit amet ipsum mauris. Maecenas congue ligula ac quam viverra nec consectetur ante hendrerit. Donec et mollis dolor.`

export function Client() {
  const [isQueryLoading, startQueryTransition] = React.useTransition()
  const [isDelayLoading, startDelayTransition] = React.useTransition()
  const [serverDelay, setServerDelay] = useQueryState(
    'serverDelay',
    delayParser.withOptions({
      startTransition: startDelayTransition
    })
  )
  const [clientDelay, setClientDelay] = useQueryState(
    'clientDelay',
    delayParser
  )
  const [q, setQ] = useQueryState(
    'q',
    queryParser.withOptions({
      throttleMs: clientDelay,
      startTransition: startQueryTransition
    })
  )
  const router = useRouter()

  const timeoutRef = React.useRef<number>()
  const [index, setIndex] = React.useState(0)

  React.useEffect(() => {
    if (index === 0) {
      return
    }
    setQ(autoFillMessage.slice(0, index))
    clearTimeout(timeoutRef.current)
    if (index === autoFillMessage.length) {
      return
    }
    timeoutRef.current = window.setTimeout(() => {
      setIndex(i => Math.min(i + 1, autoFillMessage.length))
    }, 80)
  }, [index])

  return (
    <>
      <h2>Client</h2>
      <div>
        <label>Server latency simulation </label>
        <select
          value={serverDelay}
          onChange={e =>
            setServerDelay(parseInt(e.target.value)).then(() =>
              router.refresh()
            )
          }
        >
          <option value="0">No delay</option>
          <option value="100">100ms</option>
          <option value="200">200ms</option>
          <option value="500">500ms</option>
          <option value="1000">1s</option>
        </select>
      </div>
      <div>
        <label>Throttle URL updates at </label>
        <select
          value={clientDelay}
          onChange={e => setClientDelay(parseInt(e.target.value))}
        >
          <option value="50">Default (50ms)</option>
          <option value="100">100ms</option>
          <option value="200">200ms</option>
          <option value="500">500ms</option>
          <option value="1000">1s</option>
        </select>
      </div>
      <br />
      <div>
        <label>Query </label>
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search"
        />
        {timeoutRef.current ? (
          <button
            onClick={() => {
              setIndex(0)
              clearTimeout(timeoutRef.current)
              timeoutRef.current = undefined
              setQ(null)
            }}
          >
            Cancel
          </button>
        ) : (
          <button onClick={() => setIndex(1)}>Simulate typing</button>
        )}
        <button
          onClick={() => {
            setQ('foo')
            setServerDelay(500)
          }}
        >
          Set both
        </button>
        <p>Client state: {q || <em>empty</em>}</p>
        <p>Query status: {isQueryLoading ? 'loading' : 'idle'}</p>
        <p>Delay status: {isDelayLoading ? 'loading' : 'idle'}</p>
      </div>
    </>
  )
}
