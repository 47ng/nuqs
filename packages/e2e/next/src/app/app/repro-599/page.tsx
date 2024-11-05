'use client'

import { parseAsString, useQueryState, useQueryStates } from 'nuqs'
import { Suspense } from 'react'

export default function Page() {
  return (
    <Suspense>
      <Client />
    </Suspense>
  )
}

const key = 'a &b?c=d#e%f+g"h\'i`j<k>l(m)n*o,p.q:r;s/t'
const parser = parseAsString.withDefault('')

function Client() {
  const [a, setValue] = useQueryState(key, parser)
  const [{ [key]: b }] = useQueryStates({ [key]: parser })
  return (
    <>
      <input value={a} onChange={e => setValue(e.target.value)} />
      <p>{b}</p>
      <button onClick={() => setValue('works')}>Test</button>
    </>
  )
}
