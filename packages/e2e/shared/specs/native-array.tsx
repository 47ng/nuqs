'use client'

import { parseAsInteger, parseAsNativeArrayOf, useQueryState } from 'nuqs'
import { Display } from '../components/display'

export const parser = parseAsNativeArrayOf(parseAsInteger)

export function NativeArray() {
  const [state, setState] = useQueryState('test', parser)
  return (
    <>
      <button onClick={() => setState([])}>Reset</button>
      <button
        id="add-button"
        onClick={() =>
          setState(prev => (prev ?? []).concat((prev ?? []).length + 1))
        }
      >
        Add
      </button>
      <Display environment="client" target="name" state={state?.join(' - ')} />
    </>
  )
}
