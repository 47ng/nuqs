import React, {
  type ComponentProps,
  type ReactElement,
  type ReactNode,
  useEffect,
  useState
} from 'react'

type NullDetectorProps = ComponentProps<'pre'> & {
  state: ReactNode
  enabled?: boolean
}

export function NullDetector({
  state,
  enabled = true,
  ...props
}: NullDetectorProps): ReactElement {
  const [hasBeenNullAtSomePoint, set] = useState(() =>
    enabled ? state === null : false
  )
  useEffect(() => {
    if (!enabled || state !== null) {
      return
    }
    set(true)
  }, [state, enabled])
  return <pre {...props}>{hasBeenNullAtSomePoint ? 'fail' : 'pass'}</pre>
}

export function useFakeLoadingState(trigger: unknown): {
  isLoading: boolean
  stopLoading: () => void
} {
  const [isLoading, setIsLoading] = useState(false)
  // Enter the loading state in an effect reacting to the trigger change, in the
  // same render pass as the search params update. This is the load-bearing
  // sequence that reproduces #1099 and must not change.
  useEffect(() => {
    if (!trigger) {
      return
    }
    setIsLoading(true)
  }, [trigger])
  // Exiting the loading state is driven explicitly by the test (via a button)
  // rather than a timer, so the transient `isLoading: true` state
  // can be asserted without racing a wall clock.
  return { isLoading, stopLoading: () => setIsLoading(false) }
}
