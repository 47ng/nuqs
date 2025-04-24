import { type ReactNode, useEffect, useState } from 'react'

type NullDetectorProps = {
  state: ReactNode
  id?: string
  throwOnNull?: boolean
}

export function NullDetector({
  state,
  id = 'null-detector',
  throwOnNull = false
}: NullDetectorProps) {
  const [hasBeenNullAtSomePoint, set] = useState(() => state === null)
  useEffect(() => {
    if (state !== null) {
      return
    }
    if (throwOnNull) {
      throw new Error(`Null detected in <NullDetector id="${id}">`)
    }
    console.error(`<NullDetector id="${id}">: NULL DETECTED`)
    set(true)
  }, [state])
  return <pre id={id}>{hasBeenNullAtSomePoint ? 'fail' : 'pass'}</pre>
}
