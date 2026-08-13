'use client'

import { debounce, parseAsString, useQueryState } from 'nuqs'
import { useState } from 'react'
import { Display } from '../components/display'

type QueueStatus = 'idle' | 'pending' | 'cancelled' | 'applied' | 'error'
type QueueResult = 'cancelled' | 'applied' | 'error'

export function QueueLifecycle() {
  const [hasSubscriber, setHasSubscriber] = useState(true)
  const [queueStatus, setQueueStatus] = useState<QueueStatus>('idle')

  return (
    <>
      <Display environment="client" target="queue-status" state={queueStatus} />
      {hasSubscriber ? (
        <QueueLifecycleSubscriber
          onQueued={() => {
            setQueueStatus('pending')
            setHasSubscriber(false)
          }}
          onSettled={result => setQueueStatus(result)}
        />
      ) : (
        <p id="no-query-subscribers">No query subscribers</p>
      )}
    </>
  )
}

function QueueLifecycleSubscriber({
  onQueued,
  onSettled
}: {
  onQueued: () => void
  onSettled: (result: QueueResult) => void
}) {
  const [value, setValue] = useQueryState('test', parseAsString)
  const [pushStatus, setPushStatus] = useState('idle')

  const createHistoryEntry = async () => {
    setPushStatus('pending')
    const search = await setValue('current', { history: 'push' })
    setPushStatus(search.get('test') === 'current' ? 'settled' : 'error')
  }

  const queueUpdate = () => {
    const pendingUpdate = setValue('stale', {
      limitUrlUpdates: debounce(600)
    })
    onQueued()
    void pendingUpdate.then(
      search =>
        onSettled(search.get('test') === 'stale' ? 'applied' : 'cancelled'),
      () => onSettled('error')
    )
  }

  return (
    <>
      <Display environment="client" target="query-value" state={value} />
      <Display environment="client" target="push-status" state={pushStatus} />
      <button onClick={createHistoryEntry}>Create history entry</button>
      <button onClick={queueUpdate}>Queue update</button>
    </>
  )
}
