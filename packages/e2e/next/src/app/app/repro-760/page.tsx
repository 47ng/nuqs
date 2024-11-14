'use client'

import { parseAsString, useQueryState, useQueryStates } from 'nuqs'
import { Suspense, useState } from 'react'

export default function Page() {
  return (
    <Suspense>
      <DynamicUseQueryState />
      <DynamicUseQueryStates />
    </Suspense>
  )
}

function DynamicUseQueryState() {
  const [defaultValue, setDefaultValue] = useState('a')
  const [value] = useQueryState('a', parseAsString.withDefault(defaultValue))
  return (
    <section>
      <button id="trigger-a" onClick={() => setDefaultValue('pass')}>
        Trigger
      </button>
      <span id="value-a">{value}</span>
    </section>
  )
}

function DynamicUseQueryStates() {
  const [defaultValue, setDefaultValue] = useState('b')
  const [{ value }] = useQueryStates(
    {
      value: parseAsString.withDefault(defaultValue)
    },
    { urlKeys: { value: 'b' } }
  )
  return (
    <section>
      <button id="trigger-b" onClick={() => setDefaultValue('pass')}>
        Trigger
      </button>
      <span id="value-b">{value}</span>
    </section>
  )
}
