'use client'

import { Button } from '@/src/components/ui/button'
import { parseAsInteger, useQueryState } from 'nuqs'
import { NuqsAdapter } from 'nuqs/adapters/react'
import { useEffect, useState } from 'react'

export function DemoSkeleton() {
  return (
    <figure className="flex animate-pulse flex-wrap justify-around gap-2 rounded-md border border-dashed p-2">
      <ComponentSkeleton />
      <ComponentSkeleton />
      <ComponentSkeleton />
    </figure>
  )
}

export function AlphabeticalSortDemo() {
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => {
    setHydrated(true)
  }, [])

  if (!hydrated) {
    return <DemoSkeleton />
  }

  return (
    <NuqsAdapter
      processUrlSearchParams={(search) => {
        const entries = Array.from(search.entries())
        entries.sort(([a], [b]) => a.localeCompare(b))
        return new URLSearchParams(entries)
      }}
    >
      <figure className="flex flex-wrap justify-around gap-2 rounded-md border border-dashed p-2">
        <ComponentToggle id="a" />
        <ComponentToggle id="b" />
        <ComponentToggle id="c" />
      </figure>
    </NuqsAdapter>
  )
}

export function TimestampDemo() {
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => {
    setHydrated(true)
  }, [])

  if (!hydrated) {
    return <DemoSkeleton />
  }

  return (
    <NuqsAdapter
      processUrlSearchParams={(search) => {
        const params = new URLSearchParams(search)
        params.set('ts', Date.now().toString())
        return params
      }}
    >
      <figure className="flex flex-wrap justify-around gap-2 rounded-md border border-dashed p-2">
        <ComponentIncrement id="d" />
        <ComponentIncrement id="e" />
        <ComponentIncrement id="f" />
      </figure>
    </NuqsAdapter>
  )
}

function ComponentIncrement({ id }: { id: string }) {
  const [count, setCount] = useQueryState(id, parseAsInteger.withDefault(0))

  return (
    <div className="rounded-xl p-1.5">
      <Button
        onClick={() => setCount(c => c + 1)}
        className="min-w-42 tabular-nums"
      >
        Increment "{id}": {count}
      </Button>
    </div>
  )
}

function ComponentToggle({ id }: { id: string }) {
  const [, setCount] = useQueryState(id, parseAsInteger.withDefault(0))

  return (
    <div className="rounded-xl p-1.5">
      <Button
        onClick={() => setCount(c => c ? 0 : 1)}
        className="min-w-42 tabular-nums"
      >
        Toggle "{id}"
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
