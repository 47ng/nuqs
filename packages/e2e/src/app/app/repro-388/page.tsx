'use client'

import { PrefetchKind } from 'next/dist/client/components/router-reducer/router-reducer-types'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { parseAsInteger, useQueryState } from 'nuqs'
import React, { Suspense } from 'react'

export default function Page() {
  return (
    <Suspense>
      <Client />
    </Suspense>
  )
}

function Client() {
  const router = useRouter()
  const [counter, setCounter] = useQueryState(
    'counter',
    parseAsInteger.withDefault(0)
  )
  const [mounted, setMounted] = React.useState(false)
  const manualPrefetch = React.useCallback(() => {
    router.prefetch('/', { kind: PrefetchKind.FULL })
  }, [router])

  return (
    <>
      <button id="start" onClick={() => setCounter(1)}>
        Start
      </button>
      <button id="start" onClick={() => manualPrefetch()}>
        Manual prefetch
      </button>
      <>
        <p>
          The counter is set but only in the History API, the Next.js router
          doesn't know about it. When we prefetch by hovering the link (or
          mounting it), it will reset the querystring in the URL and reset the
          counter. This only happens in production (as prefetching is disabled
          in development).
        </p>
        <p id="counter">Counter: {counter}</p>
        <button id="toggle" onClick={() => setMounted(x => !x)}>
          Toggle mount other link
        </button>
        <Link
          id="hover-me"
          href="/"
          style={{
            display: 'inline-block',
            paddingInline: '1rem',
            marginLeft: '1rem',
            border: 'solid 1px gray'
          }}
        >
          Hover me
        </Link>
        {mounted && (
          <Link
            href="/app/useQueryState"
            style={{
              display: 'inline-block',
              paddingInline: '1rem',
              marginLeft: '1rem',
              border: 'solid 1px gray'
            }}
          >
            I'm mounted
          </Link>
        )}
      </>
    </>
  )
}
