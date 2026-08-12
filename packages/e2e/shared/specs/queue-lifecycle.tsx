'use client'

import { debounce, parseAsString, useQueryState } from 'nuqs'
import { useState } from 'react'

type QueueStatus = 'idle' | 'pending' | 'cancelled' | 'applied' | 'error'

export function QueueLifecycle() {
  const [hasSubscriber, setHasSubscriber] = useState(true)
  const [queueStatus, setQueueStatus] = useState<QueueStatus>('idle')

  const handleQueuedUpdate = (promise: Promise<URLSearchParams>) => {
    setQueueStatus('pending')
    setHasSubscriber(false)
    promise.then(
      search =>
        setQueueStatus(
          search.get('test') === 'stale' ? 'applied' : 'cancelled'
        ),
      () => setQueueStatus('error')
    )
  }

  return (
    <>
      <output aria-label="Queue status">{queueStatus}</output>
      {hasSubscriber ? (
        <QueueLifecycleSubscriber onQueuedUpdate={handleQueuedUpdate} />
      ) : (
        <p id="no-query-subscribers">No query subscribers</p>
      )}
    </>
  )
}

function QueueLifecycleSubscriber({
  onQueuedUpdate
}: {
  onQueuedUpdate: (promise: Promise<URLSearchParams>) => void
}) {
  const [value, setValue] = useQueryState('test', parseAsString)
  const [pushStatus, setPushStatus] = useState('idle')

  const createHistoryEntry = async () => {
    setPushStatus('pending')
    const search = await setValue('current', { history: 'push' })
    setPushStatus(search.get('test') === 'current' ? 'settled' : 'error')
  }

  const queueUpdateAndUnmount = () => {
    onQueuedUpdate(
      setValue('stale', {
        limitUrlUpdates: debounce(600)
      })
    )
  }

  return (
    <>
      <output aria-label="Query value">{value}</output>
      <output aria-label="Push status">{pushStatus}</output>
      <button onClick={createHistoryEntry}>Create history entry</button>
      <button onClick={queueUpdateAndUnmount}>Queue update and unmount</button>
    </>
  )
}
