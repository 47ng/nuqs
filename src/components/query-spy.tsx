'use client'

import { useSearchParams } from 'next/navigation'
import React from 'react'
import { subscribeToQueryUpdates } from '../../dist'

export const QuerySpy: React.FC = () => {
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
  const qs = search.toString()

  return (
    <pre
      aria-label="Querystring spy"
      aria-description="For browsers where the query is hard to see (eg: on mobile)"
      style={{
        padding: '4px 6px',
        border: 'solid 1px gray',
        borderRadius: '4px',
        overflow: 'auto'
      }}
    >
      {qs ? (
        '?' + qs
      ) : (
        <span style={{ fontStyle: 'italic' }}>{'<empty query>'}</span>
      )}
    </pre>
  )
}
