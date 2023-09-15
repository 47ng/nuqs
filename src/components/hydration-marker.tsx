'use client'

import React from 'react'

export const HydrationMarker = () => {
  const [hydrated, setHydrated] = React.useState(false)
  React.useEffect(() => setHydrated(true), [])
  if (!hydrated) {
    return null
  }
  return (
    <div id="hydration-marker" style={{ display: 'none' }} aria-hidden>
      hydrated
    </div>
  )
}
