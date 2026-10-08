'use client'

import { debounce, useQueryState, useQueryStates } from 'nuqs'
import {
  panelDebounceMs,
  redirectQueueOptions,
  type RedirectQueueData
} from './redirect-queue.defs'

export function RedirectQueue({
  data,
  navigationState
}: {
  data: RedirectQueueData
  navigationState: string
}) {
  const [{ qHistory }] = useQueryStates(redirectQueueOptions)
  const [q, setQ] = useQueryState('q', {
    shallow: false,
    history: qHistory
  })
  const [panel, setPanel] = useQueryState('panel', {
    shallow: true,
    history: 'replace',
    limitUrlUpdates: debounce(panelDebounceMs)
  })

  return (
    <>
      <button id="set-q" onClick={() => setQ('tea')}>
        Search for tea
      </button>
      <button id="queue-panel" onClick={() => setPanel('local')}>
        Queue panel edit
      </button>
      <output id="q-state">{q}</output>
      <output id="panel-state">{panel}</output>
      <output id="loader-data">{JSON.stringify(data)}</output>
      <output id="navigation-state">{navigationState}</output>
    </>
  )
}
