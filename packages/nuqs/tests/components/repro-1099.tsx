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

export function useFakeLoadingState(trigger: unknown): boolean {
  const [isLoading, setIsLoading] = useState(false)
  useEffect(() => {
    if (!trigger) {
      return
    }
    setIsLoading(true)
    const timeout = setTimeout(() => {
      setIsLoading(false)
    }, 100)
    return () => clearTimeout(timeout)
  }, [trigger])
  return isLoading
}
