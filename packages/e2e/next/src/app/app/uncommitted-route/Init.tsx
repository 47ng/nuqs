'use client'

import { useQueryState } from 'nuqs'

const url = () => `${location.pathname}${location.search}`

// The #1358 pattern: write defaults into the URL during render. When this route
// renders before it commits, those writes must not land on the current route.
// (https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes)
export function Init({ label }: { label: string }) {
  const [mode, setMode] = useQueryState('mode')
  const [filter, setFilter] = useQueryState('filter')
  if (typeof window !== 'undefined' && !mode) {
    void setMode('default').then(search =>
      console.log(
        `init resolved ${label}: ${search.toString() || '(empty)'} | url=${url()}`
      )
    )
    void setFilter(`default-${label}`)
  }
  return (
    <p id="dest">
      {label}: mode={mode ?? 'null'} filter={filter ?? 'null'}
    </p>
  )
}
