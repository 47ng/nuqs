import { Suspense } from 'react'
import { Client } from './client'

export default function ThottlingDemoPage() {
  return (
    <>
      <h1>Throttled counters</h1>
      <p>Note: URL state updated are intentionally slowed down</p>
      <Suspense>
        <Client />
      </Suspense>
      <p>
        <a href="https://github.com/47ng/next-usequerystate/blob/next/src/app/demos/thottling/page.tsx">
          Source on GitHub
        </a>
      </p>
    </>
  )
}
