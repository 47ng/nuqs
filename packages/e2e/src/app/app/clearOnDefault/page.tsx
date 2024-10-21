'use client'

import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsJson,
  useQueryState
} from 'nuqs'
import { Suspense } from 'react'

export default function Page() {
  return (
    <Suspense>
      <Client />
    </Suspense>
  )
}

const defaultJSON = { foo: 'bar' }
const runtimePassthrough = (x: unknown) => x

function Client() {
  const [, setA] = useQueryState('a')
  const [, setB] = useQueryState('b', {
    defaultValue: '',
    clearOnDefault: true
  })
  const [, setArray] = useQueryState(
    'array',
    parseAsArrayOf(parseAsInteger)
      .withDefault([])
      .withOptions({ clearOnDefault: true })
  )
  const [, setJsonRef] = useQueryState(
    'json-ref',
    parseAsJson(runtimePassthrough)
      .withDefault(defaultJSON)
      .withOptions({ clearOnDefault: true })
  )
  const [, setJsonNew] = useQueryState(
    'json-new',
    parseAsJson(runtimePassthrough)
      .withDefault(defaultJSON)
      .withOptions({ clearOnDefault: true })
  )
  return (
    <>
      <button
        onClick={() => {
          setA('')
          setB('')
          setArray([])
          setJsonRef(defaultJSON)
          setJsonNew({ ...defaultJSON })
        }}
      >
        Clear
      </button>
    </>
  )
}
