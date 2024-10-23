'use client'

import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsJson,
  parseAsString,
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
    defaultValue: ''
  })
  const [, setArray] = useQueryState(
    'array',
    parseAsArrayOf(parseAsInteger).withDefault([])
  )
  const [, setJsonRef] = useQueryState(
    'json-ref',
    parseAsJson(runtimePassthrough).withDefault(defaultJSON)
  )
  const [, setJsonNew] = useQueryState(
    'json-new',
    parseAsJson(runtimePassthrough).withDefault(defaultJSON)
  )
  const [, keepMe] = useQueryState(
    'keepMe',
    parseAsString.withDefault('').withOptions({ clearOnDefault: false })
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
          keepMe('')
        }}
      >
        Clear
      </button>
    </>
  )
}
