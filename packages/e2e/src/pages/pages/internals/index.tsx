import React from 'react'
import { HydrationMarker } from '../../../components/hydration-marker'

export default function Page() {
  const [hydrated, setHydrated] = React.useState(false)
  React.useEffect(() => setHydrated(true), [])
  if (!hydrated) return <>Hydrating...</>

  return (
    <>
      <HydrationMarker />
      <p id="__N">{String(history.state.__N)}</p>
      <p id="__NA">{String(history.state.__NA)}</p>
      <p id="basePath">
        {String(
          // @ts-expect-error
          window?.next?.router?.basePath ?? ''
        )}
      </p>
    </>
  )
}
