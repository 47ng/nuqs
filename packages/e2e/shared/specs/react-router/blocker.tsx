'use client'

import { parseAsInteger, useQueryState } from 'nuqs'
import { useState } from 'react'

type BlockerProps = {
  useBlocker: (enabled: boolean) => {
    state: string
    reset?: () => void
    proceed?: () => void
  }
  useNavigation: () => { state: string }
  useNavigate: () => (to: string) => void | Promise<void>
}

export function Blocker({
  useBlocker,
  useNavigation,
  useNavigate
}: BlockerProps) {
  const navigation = useNavigation()
  const navigate = useNavigate()
  const [showControls, setShowControls] = useState(true)
  const [showBlocker, setShowBlocker] = useState(true)

  return (
    <>
      <output id="navigation">{navigation.state}</output>
      <button id="router-push" onClick={() => navigate('?count=3')}>
        Router push
      </button>
      <button
        id="toggle-controls"
        onClick={() => setShowControls(show => !show)}
      >
        Toggle query controls
      </button>
      <button id="toggle-blocker" onClick={() => setShowBlocker(show => !show)}>
        Toggle blocker
      </button>
      {showBlocker && <BlockerControls useBlocker={useBlocker} />}
      {showControls && <QueryControls />}
    </>
  )
}

function BlockerControls({ useBlocker }: Pick<BlockerProps, 'useBlocker'>) {
  const [enabled, setEnabled] = useState(true)
  const blocker = useBlocker(enabled)
  return (
    <>
      <output id="blocker">{blocker.state}</output>
      <label>
        <input
          id="enabled"
          type="checkbox"
          checked={enabled}
          onChange={event => setEnabled(event.target.checked)}
        />
        Block navigation
      </label>
      {blocker.state === 'blocked' && (
        <>
          <button id="cancel" onClick={() => blocker.reset?.()}>
            Cancel
          </button>
          <button id="proceed" onClick={() => blocker.proceed?.()}>
            Proceed
          </button>
        </>
      )}
    </>
  )
}

function QueryControls() {
  const [count, setCount] = useQueryState(
    'count',
    parseAsInteger.withDefault(0)
  )
  return (
    <>
      <output id="count">{count}</output>
      <button
        id="deep"
        onClick={() =>
          setCount(n => n + 1, { history: 'push', shallow: false })
        }
      >
        Deep push
      </button>
      <button
        id="deep-replace"
        onClick={() =>
          setCount(n => n + 1, { history: 'replace', shallow: false })
        }
      >
        Deep replace
      </button>
      <button
        id="shallow"
        onClick={() => setCount(n => n + 1, { history: 'push', shallow: true })}
      >
        Shallow push
      </button>
      <button
        id="shallow-decrement"
        onClick={() => setCount(n => n - 1, { history: 'push', shallow: true })}
      >
        Shallow decrement
      </button>
    </>
  )
}
