'use client'

import { useSearchParams } from 'next/navigation'
import { subscribeToQueryUpdates } from 'nuqs'
import React from 'react'
import { QuerySpySkeleton } from './query-spy.skeleton'

export function QuerySpy(props: React.ComponentProps<'pre'>) {
  const initialSearchParams = useSearchParams()
  const [search, setSearch] = React.useState<URLSearchParams>(() => {
    if (typeof location !== 'object') {
      // SSR
      const out = new URLSearchParams()
      if (!initialSearchParams) {
        return out
      }
      for (const [key, value] of initialSearchParams) {
        out.set(key, value)
      }
      return out
    } else {
      return new URLSearchParams(location.search)
    }
  })

  React.useLayoutEffect(
    () => subscribeToQueryUpdates(({ search }) => setSearch(search)),
    []
  )

  return (
    <QuerySpySkeleton {...props}>
      {search.size > 0 && (
        <span className="text-zinc-500">
          ?
          {Array.from(search.entries()).map(([key, value], i) => (
            <React.Fragment key={key + i}>
              <span className="text-[#005CC5] dark:text-[#79B8FF]">{key}</span>=
              <span className="text-[#D73A49] dark:text-[#F97583]">
                {value}
              </span>
              {i < search.size - 1 && <span className="text-zinc-500">&</span>}
            </React.Fragment>
          ))}
        </span>
      )}
      {search.size === 0 && (
        <span className="italic text-zinc-500">{'<empty query>'}</span>
      )}
    </QuerySpySkeleton>
  )
}
