'use client'

import React, { Suspense } from 'react'

export default function Page() {
  return (
    <Suspense>
      <Client />
    </Suspense>
  )
}

function Client() {
  const [nextJsVersion, setNextJsVersion] = React.useState<string | null>(null)
  React.useEffect(() => {
    // @ts-expect-error
    setNextJsVersion(window.next?.version)
  }, [])
  return <p id="nextJsVersion">{nextJsVersion}</p>
}
