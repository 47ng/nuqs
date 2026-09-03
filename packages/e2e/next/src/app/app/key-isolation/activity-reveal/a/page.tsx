'use client'

import { Display } from 'e2e-shared/components/display'
import Link from 'next/link'
import { useQueryState } from 'nuqs'
import { memo, Suspense, useEffect, useState } from 'react'

const Page = memo(function Page() {
  const [name, setName] = useQueryState('name', { history: 'push' })
  const [retained, setRetained] = useState(false)

  useEffect(() => {
    console.log(`activity commit: ${name ?? '<null>'}`)
  })

  return (
    <>
      <code id="activity-value">{name}</code>
      <Display
        environment="client"
        target="activity-retained"
        state={String(retained)}
      />
      <button onClick={() => setRetained(true)}>Mark retained</button>
      <button onClick={() => setName('stale-value')}>Set stale</button>
      <Link
        href="/app/key-isolation/activity-reveal/b?name=stale-value"
        replace
        prefetch={false}
      >
        Go to B
      </Link>
    </>
  )
})

export default function Root() {
  return (
    <Suspense>
      <Page />
    </Suspense>
  )
}
