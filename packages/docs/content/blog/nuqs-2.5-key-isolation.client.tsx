'use client'

import { Button } from '@/src/components/ui/button'
import { parseAsInteger, useQueryState } from 'nuqs'
import { NuqsAdapter } from 'nuqs/adapters/react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'

export function KeyIsolationStyles() {
  return (
    <style key="flash-fade-keyframes">{`
        :root {
          --flash-color: oklch(0.627 0.265 303.9); /* Tailwind purple-500 */
        }
        @keyframes flashOutline {
          0% {
            box-shadow: 0 0 6px 4px var(--flash-color);
          }
          100% {
            box-shadow: 0 0 0px 0px transparent;
          }
        }
        .flash-outline {
          animation: flashOutline 250ms ease-out both;
        }
      `}</style>
  )
}

export function DemoSkeleton() {
  return (
    <figure className="flex animate-pulse flex-wrap justify-around gap-8 rounded-md border border-dashed p-4">
      <ComponentSkeleton />
      <ComponentSkeleton />
    </figure>
  )
}

export function WithoutKeyIsolationDemo() {
  return (
    <figure className="flex flex-wrap justify-around gap-2 rounded-md border border-dashed p-2">
      <Component id="a" />
      <Component id="b" />
    </figure>
  )
}

export function WithKeyIsolationDemo() {
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => {
    setHydrated(true)
  }, [])
  if (!hydrated) {
    return <DemoSkeleton />
  }
  return (
    <NuqsAdapter>
      <figure className="flex flex-wrap justify-around gap-2 rounded-md border border-dashed p-2">
        <Component id="c" />
        <Component id="d" />
      </figure>
    </NuqsAdapter>
  )
}

function Component({ id }: { id: string }) {
  const [count, setCount] = useQueryState(id, parseAsInteger.withDefault(0))
  const renders = useRef(0)
  renders.current += 1
  const wrapperRef = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const div = wrapperRef.current
    if (!div) {
      return
    }
    div.classList.remove('flash-outline')
    div.offsetWidth // Trigger reflow to restart the animation
    div.classList.add('flash-outline')
  })

  return (
    <div className="rounded-xl p-1.5 [will-change:box-shadow]" ref={wrapperRef}>
      <Button
        onClick={() => setCount(c => c + 1)}
        className="min-w-42 tabular-nums"
      >
        Increment "{id}": {count}
      </Button>
    </div>
  )
}

function ComponentSkeleton() {
  return (
    <div className="rounded-xl p-1.5">
      <Button disabled className="min-w-42 tabular-nums">
        Loading demo...
      </Button>
    </div>
  )
}
