'use client'

import React from 'react'

export default function Page() {
  const [hydrated, setHydrated] = React.useState(false)
  React.useEffect(() => setHydrated(true), [])
  if (!hydrated) return <>Hydrating...</>

  return (
    <>
      <p id="__N">{String(history.state.__N)}</p>
      <p id="__NA">{String(history.state.__NA)}</p>
      <p id="windowHistorySupport">
        {String(process.env.__NEXT_WINDOW_HISTORY_SUPPORT)}
      </p>
    </>
  )
}
