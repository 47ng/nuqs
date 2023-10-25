import { Suspense } from 'react'
import { DebugClient } from './client.debug'
import { ReleaseClient } from './client.release'

export default function BundleInteropDemo() {
  return (
    <>
      <h1>Bundle interop demo</h1>
      <Suspense>
        <DebugClient />
      </Suspense>
      <Suspense>
        <ReleaseClient />
      </Suspense>
      <p>
        <a href="https://github.com/47ng/next-usequerystate/blob/next/src/app/demos/debug-release-interop/page.tsx">
          Source on GitHub
        </a>
      </p>
    </>
  )
}
