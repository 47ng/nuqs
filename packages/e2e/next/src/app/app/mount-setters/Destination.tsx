'use client'

import { useQueryState } from 'nuqs'
import { useLayoutEffect } from 'react'

// Writes to the URL from a layout effect, in the commit that brings this
// route in.
export function Destination() {
  const [init, setInit] = useQueryState('init')
  useLayoutEffect(() => {
    void setInit('ready')
  }, [])
  return <p id="init">init: {init ?? 'null'}</p>
}
