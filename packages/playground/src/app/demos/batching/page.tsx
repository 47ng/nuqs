'use client'

import { parseAsFloat, useQueryState } from 'src/nuqs'

const parser = parseAsFloat.withDefault(0)

export default function BuilderPatternDemoPage() {
  const [lat, setLat] = useQueryState('lat', parser)
  const [lng, setLng] = useQueryState('lng', parser)

  const latStr = lat.toString().split('.')
  const lngStr = lng.toString().split('.')

  return (
    <>
      <h1>Batching</h1>
      <button
        onClick={async () => {
          // Call as many state updates as needed in the same event loop tick,
          // and they will be asynchronously batched into one update.
          const p1 = setLat(Math.random() * 180 - 90)
          const p2 = setLng(Math.random() * 360 - 180)
          // The returned promise is cached until next flush to the URL occurs
          console.log('Ref eq: ', p1 === p2)
          p1.then(search => console.log('Awaited: %s', search.toString()))
        }}
      >
        Random coordinate
      </button>
      <pre>
        <code>
          {/* Aligning the decimals */}
          Lat {latStr[0].padStart(4) + '.' + (latStr[1] ?? '00')}
          {'\n'}
          Lng {lngStr[0].padStart(4) + '.' + (lngStr[1] ?? '00')}
        </code>
      </pre>
      <p>
        <a href="https://github.com/47ng/next-usequerystate/blob/next/src/app/demos/batching/page.tsx">
          Source on GitHub
        </a>
      </p>
    </>
  )
}
