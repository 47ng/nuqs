'use client'

import { debounce, parseAsString, useQueryState } from 'nuqs'
import { useState } from 'react'
import { Display } from '../components/display'

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
      <Display environment="client" target="queue-status" state={queueStatus} />
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
      <Display environment="client" target="query-value" state={value} />
      <Display environment="client" target="push-status" state={pushStatus} />
      <button onClick={createHistoryEntry}>Create history entry</button>
      <button onClick={queueUpdateAndUnmount}>Queue update and unmount</button>
    </>
  )
}
