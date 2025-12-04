'use client'

import { useSyncExternalStore } from 'react'

const subscribe = () => () => {}
const trueOnClient = () => true
const falseOnSSR = () => false

export const HydrationMarker = () => {
  const showMarker = useSyncExternalStore(subscribe, trueOnClient, falseOnSSR)
  if (!showMarker) {
    return null
  }
  return (
    <div id="hydration-marker" style={{ display: 'none' }} aria-hidden>
      hydrated
    </div>
  )
}
