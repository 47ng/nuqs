'use client'

import { parseAsString, useQueryState } from 'nuqs'
import { useEffect } from 'react'

function Child() {
  const [, setFilter] = useQueryState('filter', parseAsString)
  useEffect(() => {
    console.log('child:mount')
    void setFilter(null)
    return () => console.log('child:unmount')
  }, [])
  return <p id="child">child</p>
}

export function Repro1612() {
  const [selected, setSelected] = useQueryState('selected', parseAsString)
  useEffect(() => {
    console.log(`commit:${selected ?? '<null>'}`)
  }, [selected])
  return (
    <>
      <button
        onClick={async () => {
          await new Promise(resolve => setTimeout(resolve, 10))
          void setSelected('item-1', { history: 'push' })
        }}
      >
        async
      </button>
      <button onClick={() => void setSelected('item-1', { history: 'push' })}>
        sync
      </button>
      <pre id="selected">{String(selected)}</pre>
      {selected ? <Child /> : null}
    </>
  )
}
