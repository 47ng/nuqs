'use client'

import { debounce, useQueryStates } from 'nuqs'
import { Display } from '../components/display'
import { controlSearchParams, searchParams } from './popstate-queue-reset.defs'

export function PopstateQueueResetClient({
  onNavigateToOther
}: {
  onNavigateToOther?: () => void
}) {
  const [{ debounceTime, value }, setControls] =
    useQueryStates(controlSearchParams)
  const [{ a, b, c }, setSearchParams] = useQueryStates(searchParams)

  // Debounced value update - used to test queue cancellation on popstate
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setControls(
      { value: e.target.value || null },
      { limitUrlUpdates: debounce(debounceTime) }
    )
  }

  // Staggered updates to test queue reset and mutex state
  const triggerStaggeredUpdates = () => {
    setSearchParams(old => ({ a: old.a + 1 }))
    setSearchParams(old => ({ b: old.b + 1 }), {
      limitUrlUpdates: debounce(250)
    })
    setSearchParams(old => ({ c: old.c + 1 }), {
      limitUrlUpdates: debounce(500)
    })
  }

  // Individual updates to test sequencing after popstate
  const triggerA = () => setSearchParams(old => ({ a: old.a + 1 }))
  const triggerB = () =>
    setSearchParams(old => ({ b: old.b + 1 }), {
      limitUrlUpdates: debounce(100)
    })
  const triggerC = () =>
    setSearchParams(old => ({ c: old.c + 1 }), {
      limitUrlUpdates: debounce(200)
    })

  // Trigger ONLY debounced updates (no immediate update)
  // This is used to test popstate reset without triggering the
  // normal onHistoryStateUpdate -> resetQueues flow
  const triggerDebouncedOnly = () => {
    setSearchParams(old => ({ b: old.b + 1 }), {
      limitUrlUpdates: debounce(300)
    })
    setSearchParams(old => ({ c: old.c + 1 }), {
      limitUrlUpdates: debounce(500)
    })
  }

  return (
    <>
      <Display environment="client" state={[a, b, c].join(',')} />
      <div id="value-display">{value}</div>
      <input
        type="text"
        id="debounced-input"
        value={value}
        onChange={handleInputChange}
        placeholder="Type to trigger debounced update"
      />
      <button id="staggered-updates" onClick={triggerStaggeredUpdates}>
        Trigger staggered updates
      </button>
      <button id="trigger-a" onClick={triggerA}>
        Trigger A
      </button>
      <button id="trigger-b" onClick={triggerB}>
        Trigger B
      </button>
      <button id="trigger-c" onClick={triggerC}>
        Trigger C
      </button>
      <button id="debounced-only" onClick={triggerDebouncedOnly}>
        Trigger Debounced Only
      </button>
      <button id="reset" onClick={() => setSearchParams(null)}>
        Reset
      </button>
      {onNavigateToOther && (
        <button id="navigate-to-other" onClick={onNavigateToOther}>
          Navigate to Other
        </button>
      )}
    </>
  )
}

export function PopstateQueueResetOther() {
  return (
    <div>
      <h1 id="other-page">Other Page</h1>
      <p>This is a different page for back/forward navigation testing</p>
    </div>
  )
}
