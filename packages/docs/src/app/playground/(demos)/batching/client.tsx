'use client'

import { Button } from '@/src/components/ui/button'
import { parseAsFloat, useQueryState } from 'nuqs'

const parser = parseAsFloat.withDefault(0)

export default function BuilderPatternDemoPage() {
  const [lat, setLat] = useQueryState('lat', parser)
  const [lng, setLng] = useQueryState('lng', parser)
  return (
    <>
      <Button
        onClick={async () => {
          // Call as many state updates as needed in the same event loop tick,
          // and they will be asynchronously batched into one update.
          const p1 = setLat(Math.random() * 180 - 90)
          const p2 = setLng(Math.random() * 360 - 180)
          // The returned promise is cached until next flush to the URL occurs
          console.log('Promise cached: ', p1 === p2)
          p1.then(search => console.log('Awaited: %s', search.toString()))
        }}
        className="mb-2"
      >
        Random coordinates
      </Button>
      <ul className="mb-4 space-y-2">
        <li>Latitude: {lat}</li>
        <li>Longitude: {lng}</li>
      </ul>
    </>
  )
}
