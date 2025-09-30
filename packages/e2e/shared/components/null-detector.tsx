import { type ReactNode, useEffect, useState } from 'react'

type NullDetectorProps = {
  state: ReactNode
  id?: string
  throwOnNull?: boolean
  enabled?: boolean
}

export function NullDetector({
  state,
  id = 'null-detector',
  throwOnNull = false,
  enabled = true
}: NullDetectorProps) {
  const [hasBeenNullAtSomePoint, set] = useState(() =>
    enabled ? state === null : false
  )
  useEffect(() => {
    if (state !== null || !enabled) {
      return
    }
    if (throwOnNull) {
      throw new Error(`Null detected in <NullDetector id="${id}">`)
    }
    console.error(`<NullDetector id="${id}">: NULL DETECTED`)
    set(true)
  }, [enabled, state])
  return <pre id={id}>{hasBeenNullAtSomePoint ? 'fail' : 'pass'}</pre>
}
