'use client'

import { useQueryState, useQueryStates } from 'nuqs'
import { useState, type ComponentProps } from 'react'
import {
  pendingLoaderOptions,
  type LoaderRequestData
} from './pending-loader.defs'

export function PendingLoader({
  data,
  navigationState,
  useBlocker
}: {
  data: LoaderRequestData
  navigationState: string
  useBlocker?: (enabled: boolean) => {
    state: string
    reset?: () => void
    proceed?: () => void
  }
}) {
  const [{ qHistory, pageHistory, panelHistory }] =
    useQueryStates(pendingLoaderOptions)
  const [q, setQ] = useQueryState('q', {
    shallow: false,
    history: qHistory
  })
  const [page, setPage] = useQueryState('page', {
    shallow: false,
    history: pageHistory
  })
  const [panel, setPanel] = useQueryState('panel', {
    shallow: true,
    history: panelHistory
  })

  return (
    <>
      <button id="set-q" onClick={() => setQ('tea')}>
        Search for tea
      </button>
      <button id="set-page" onClick={() => setPage('2')}>
        Next page
      </button>
      <button
        id="set-both"
        onClick={() => {
          setQ('tea')
          setPage('2')
        }}
      >
        Search and change page
      </button>
      <button id="panel-before" onClick={() => setPanel('before')}>
        Show panel
      </button>
      <button id="panel-open" onClick={() => setPanel('open')}>
        Expand panel
      </button>
      {useBlocker && <PendingBlocker useBlocker={useBlocker} />}
      <output id="q-state">{q}</output>
      <output id="page-state">{page}</output>
      <output id="panel-state">{panel}</output>
      <output id="loader-data">{JSON.stringify(data)}</output>
      <output id="navigation-state">{navigationState}</output>
    </>
  )
}

function PendingBlocker({
  useBlocker
}: {
  useBlocker: NonNullable<ComponentProps<typeof PendingLoader>['useBlocker']>
}) {
  const [enabled, setEnabled] = useState(false)
  const blocker = useBlocker(enabled)
  return (
    <>
      <label>
        <input
          id="block-navigation"
          type="checkbox"
          checked={enabled}
          onChange={event => setEnabled(event.target.checked)}
        />
        Block navigation
      </label>
      <output id="blocker">{blocker.state}</output>
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
