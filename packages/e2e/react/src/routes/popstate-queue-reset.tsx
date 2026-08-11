import { debounce, useQueryState } from 'nuqs'
import { useState } from 'react'

export default function PopstateQueueReset() {
  const [query, setQuery] = useQueryState('q')
  const [updateStatus, setUpdateStatus] = useState<
    'idle' | 'pending' | 'settled'
  >('idle')

  async function pushCurrentValue() {
    setUpdateStatus('pending')
    await setQuery('current', { history: 'push' })
    setUpdateStatus('settled')
  }

  async function queueDebouncedValue(value: string) {
    setUpdateStatus('pending')
    await setQuery(value || null, {
      limitUrlUpdates: debounce(500)
    })
    setUpdateStatus('settled')
  }

  return (
    <>
      <button type="button" onClick={pushCurrentValue}>
        Push current value
      </button>
      <label>
        Query
        <input
          value={query ?? ''}
          onChange={event => queueDebouncedValue(event.target.value)}
        />
      </label>
      <output aria-label="Query value">{query}</output>
      <output aria-label="Update status">{updateStatus}</output>
    </>
  )
}
