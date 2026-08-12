import { Display } from 'e2e-shared/components/display'
import { debounce, useQueryState } from 'nuqs'
import { useState } from 'react'

export default function PopstateQueueReset() {
  const [query, setQuery] = useQueryState('q', { defaultValue: '' })
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
    await setQuery(value, {
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
          value={query}
          onChange={event => queueDebouncedValue(event.target.value)}
        />
      </label>
      <Display environment="client" target="query-value" state={query} />
      <Display
        environment="client"
        target="update-status"
        state={updateStatus}
      />
    </>
  )
}
