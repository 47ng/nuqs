'use client'

import { debounce, useQueryState } from 'nuqs'
import { useState } from 'react'

type Repro1563Props = {
  loaderCall: number
  loaderState?: string | null
  useNavigate: () => (
    to: string,
    options?: { replace?: boolean }
  ) => void | Promise<void>
  useNavigation: () => { state: string }
  useNavigationType: () => string
  useBlocker?: (enabled: boolean) => {
    state: string
    reset?: () => void
    proceed?: () => void
  }
}

export function Repro1563({
  loaderCall,
  loaderState,
  useNavigate,
  useNavigation,
  useNavigationType,
  useBlocker
}: Repro1563Props) {
  const [state, setState] = useQueryState('test', {
    history: 'push',
    shallow: false
  })
  const [, setOther] = useQueryState('other', { shallow: false })
  const [shallow, setShallow] = useQueryState('shallow')
  const navigate = useNavigate()
  const navigation = useNavigation()
  const navigationType = useNavigationType()
  const pushThenReplace = () => {
    setState('pass')
    setOther('pass', { limitUrlUpdates: debounce(100) })
  }

  return (
    <>
      <button id="push" onClick={() => setState('pass')}>
        Push
      </button>
      <button
        id="router-replace"
        onClick={() => {
          const search = new URLSearchParams(location.search)
          search.set('redirected', 'pass')
          navigate(`${location.pathname}?${search}`, { replace: true })
        }}
      >
        Router replace
      </button>
      <button
        id="debounced-other"
        onClick={() => setOther('pass', { limitUrlUpdates: debounce(2000) })}
      >
        Debounced replace
      </button>
      <button id="push-then-replace" onClick={pushThenReplace}>
        Push then replace
      </button>
      <button
        id="deep-replace"
        onClick={() => setState('pass', { history: 'replace' })}
      >
        Deep replace
      </button>
      <button
        id="push-other"
        onClick={() => setOther('pass', { history: 'push' })}
      >
        Push other
      </button>
      <button
        id="shallow-replace"
        onClick={() =>
          setShallow('pass', {
            history: 'replace',
            shallow: true,
            limitUrlUpdates: debounce(100)
          })
        }
      >
        Shallow replace
      </button>
      <button
        id="shallow-push"
        onClick={() =>
          setShallow('pass', {
            history: 'push',
            shallow: true,
            limitUrlUpdates: debounce(100)
          })
        }
      >
        Shallow push
      </button>
      <button id="replace" onClick={() => setOther('pass')}>
        Replace
      </button>
      <pre id="state">{state}</pre>
      <pre id="shallow-state">{shallow}</pre>
      <pre id="loader-call">{loaderCall}</pre>
      <pre id="loader-state">{loaderState}</pre>
      <pre id="navigation-state">{navigation.state}</pre>
      <pre id="navigation-type">{navigationType}</pre>
      {useBlocker && <LinkBlocker useBlocker={useBlocker} />}
    </>
  )
}

function LinkBlocker({
  useBlocker
}: {
  useBlocker: NonNullable<Repro1563Props['useBlocker']>
}) {
  const [enabled, setEnabled] = useState(false)
  const blocker = useBlocker(enabled)
  return (
    <>
      <label>
        <input
          id="block-links"
          type="checkbox"
          checked={enabled}
          onChange={event => setEnabled(event.target.checked)}
        />
        Block navigation
      </label>
      <output id="blocker">{blocker.state}</output>
      {blocker.state === 'blocked' && (
        <>
          <button id="cancel-link" onClick={() => blocker.reset?.()}>
            Cancel
          </button>
          <button id="proceed-link" onClick={() => blocker.proceed?.()}>
            Proceed
          </button>
        </>
      )}
    </>
  )
}
