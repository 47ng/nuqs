'use client'

import { parseAsBoolean, parseAsInteger, useQueryState } from 'nuqs'
import { useEffect, useRef } from 'react'

export function Repro1365() {
  const [a, setA] = useQueryState('a', parseAsBoolean.withDefault(false))
  const [b, setB] = useQueryState('b', parseAsInteger.withDefault(0))
  const effectCount = useRef(0)

  useEffect(() => {
    effectCount.current++
    console.log('effect')
    void setB(prev => prev + 1)
  }, [a])

  return (
    <>
      <pre id="a">{String(a)}</pre>
      <pre id="b">{String(b)}</pre>
      <pre id="effect-count">{effectCount.current}</pre>
      <button onClick={() => void setA(prev => !prev)}>toggle</button>
    </>
  )
}
