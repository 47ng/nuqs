'use client'

import Link from 'next/link'
import { parseAsJson, useQueryState, useQueryStates } from 'nuqs'
import { Suspense, useEffect, useState } from 'react'

export default function Page() {
  return (
    <Suspense>
      <Client />
    </Suspense>
  )
}

const defaultValue = { x: 0 }
type Value = typeof defaultValue

function increment(value: Value): Value {
  return { x: value.x + 1 }
}

const makeLoggingSpy =
  (key: string) =>
  (value: unknown): Value => {
    console.log(`[%s]: Parser running with value %O`, key, value)
    return value as Value
  }

function Client() {
  const [aRefCount, setARefCount] = useState(0)
  const [bRefCount, setBRefCount] = useState(0)
  const [a, setA] = useQueryState(
    'a',
    parseAsJson<Value>(makeLoggingSpy('a')).withDefault(defaultValue)
  )
  const [{ b }, setB] = useQueryStates({
    b: parseAsJson<Value>(makeLoggingSpy('b')).withDefault(defaultValue)
  })

  useEffect(() => {
    setARefCount(old => old + 1)
  }, [a])
  useEffect(() => {
    setBRefCount(old => old + 1)
  }, [b])

  return (
    <>
      <div>
        <button id="increment-a" onClick={() => setA(increment)}>
          Increment A
        </button>
        <button id="idempotent-a" onClick={() => setA(x => x)}>
          Itempotent A
        </button>
        <button id="clear-a" onClick={() => setA(null)}>
          Clear A
        </button>
        <span>
          Refs seen: <span id="ref-a">{aRefCount}</span>
        </span>
      </div>
      <div>
        <button
          id="increment-b"
          onClick={() =>
            setB(old => ({
              b: increment(old.b)
            }))
          }
        >
          Increment B
        </button>
        <button id="idempotent-b" onClick={() => setB(x => x)}>
          Itempotent B
        </button>
        <button
          id="clear-b"
          onClick={() =>
            setB({
              b: null
            })
          }
        >
          Clear B
        </button>
        <span>
          Refs seen: <span id="ref-b">{bRefCount}</span>
        </span>
      </div>
      <div>
        <Link href="#" id="link">
          Link to #
        </Link>
      </div>
    </>
  )
}
