'use client'

import { useSearchParams } from 'next/navigation'
import { createSerializer } from 'nuqs/server'
import React from 'react'
import { QuerySpySkeleton } from './query-spy.skeleton'

const serialize = createSerializer({})

export function QuerySpy(props: React.ComponentProps<'pre'>) {
  useSearchParams() // Just using it to trigger re-render on query change
  const searchParams = parseQuery(
    serialize(new URLSearchParams(location.search), {}).slice(1) // Remove leading '?'
  )

  return (
    <QuerySpySkeleton {...props}>
      {searchParams.length > 0 && (
        <span className="text-zinc-500">
          ?
          {searchParams.map(([key, value], i) => (
            <React.Fragment key={key + i}>
              <span className="text-[#005CC5] dark:text-[#79B8FF]">{key}</span>=
              <span className="text-[#D73A49] dark:text-[#F97583]">
                {value}
              </span>
              {i < searchParams.length - 1 && (
                <span className="text-zinc-500">&</span>
              )}
            </React.Fragment>
          ))}
        </span>
      )}
      {searchParams.length === 0 && (
        <span className="italic text-zinc-500">{'<empty query>'}</span>
      )}
    </QuerySpySkeleton>
  )
}

function parseQuery(queryString: string): [string, string][] {
  const elements = queryString.split('&')
  if (elements.length === 0) return []
  return elements.reduce(
    (acc, element) => {
      if (element === '') return acc
      const [key, value] = element.split('=')
      return [...acc, [key, value]]
    },
    [] as [string, string][]
  )
}
