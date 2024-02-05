'use client'

import { useSearchParams } from 'next/navigation'
import React from 'react'
import { QuerySpySkeleton } from './query-spy.skeleton'

export function QuerySpy(props: React.ComponentProps<'pre'>) {
  const searchParams = useSearchParams()
  return (
    <QuerySpySkeleton {...props}>
      {searchParams.size > 0 && (
        <span className="text-zinc-500">
          ?
          {Array.from(searchParams.entries()).map(([key, value], i) => (
            <React.Fragment key={key + i}>
              <span className="text-[#005CC5] dark:text-[#79B8FF]">{key}</span>=
              <span className="text-[#D73A49] dark:text-[#F97583]">
                {value}
              </span>
              {i < searchParams.size - 1 && (
                <span className="text-zinc-500">&</span>
              )}
            </React.Fragment>
          ))}
        </span>
      )}
      {searchParams.size === 0 && (
        <span className="italic text-zinc-500">{'<empty query>'}</span>
      )}
    </QuerySpySkeleton>
  )
}
