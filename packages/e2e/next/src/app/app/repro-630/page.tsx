'use client'

import { parseAsString, useQueryState, useQueryStates } from 'nuqs'
import { Suspense } from 'react'

export default function Page() {
  return (
    <Suspense>
      <Client id="1" />
      <Client id="2" />
      <Clients id="3" />
      <Clients id="4" />
    </Suspense>
  )
}

type ClientProps = {
  id: string
}

function Client({ id }: ClientProps) {
  const [a, setA] = useQueryState(
    'a',
    parseAsString.withOptions({ history: 'push' })
  )
  const [b, setB] = useQueryState(
    'b',
    parseAsString.withOptions({ history: 'push' })
  )

  return (
    <>
      <p>useQueryState {id}</p>
      <pre id={`${id}-pre`}>{JSON.stringify({ a, b })}</pre>
      <button
        id={`${id}-set`}
        onClick={() => {
          setA('1')
          setB('2')
        }}
      >
        Set
      </button>
      <button
        id={`${id}-clear`}
        onClick={() => {
          setA(null)
          setB(null)
        }}
      >
        Clear
      </button>
      <hr />
    </>
  )
}

function Clients({ id }: ClientProps) {
  const [params, setParams] = useQueryStates(
    {
      a: parseAsString,
      b: parseAsString
    },
    { history: 'push' }
  )
  return (
    <>
      <p>useQueryStates {id}</p>
      <pre id={`${id}-pre`}>{JSON.stringify(params)}</pre>
      <button id={`${id}-set`} onClick={() => setParams({ a: '1', b: '2' })}>
        Set
      </button>
      <button id={`${id}-clear`} onClick={() => setParams(null)}>
        Clear
      </button>
      <hr />
    </>
  )
}
