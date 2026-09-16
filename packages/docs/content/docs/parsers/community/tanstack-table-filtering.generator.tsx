'use client'

import { CodeBlock } from '@/src/components/code-block.client'
import { TsLogo } from '@/src/components/icons/ts-logo'
import { QuerySpy } from '@/src/components/query-spy'
import { Button } from '@/src/components/ui/button'
import { Label } from '@/src/components/ui/label'
import { parseAsString, useQueryStates } from 'nuqs'
import { useDeferredValue } from 'react'

// One URL key per filterable column. `useQueryStates` keeps them in a single
// object that maps cleanly onto TanStack Table's `ColumnFiltersState`.
const filterParsers = {
  name: parseAsString,
  country: parseAsString
}

const useFiltersQuery = () => useQueryStates(filterParsers)

const FilterInput = ({
  id,
  value,
  onChange
}: {
  id: string
  value: string
  onChange: (value: string | null) => void
}) => (
  <input
    id={id}
    className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
    value={value}
    placeholder={`Filter by ${id}…`}
    onChange={e => onChange(e.target.value || null)}
  />
)

export function TanStackTableFiltering() {
  const [filters, setFilters] = useFiltersQuery()

  // Map the query state object onto TanStack Table's ColumnFiltersState,
  // dropping any columns that aren't currently being filtered.
  const columnFilters = Object.entries(filters)
    .filter(([, value]) => value !== null)
    .map(([id, value]) => ({ id, value }))

  const internalState = useDeferredValue(JSON.stringify(columnFilters, null, 2))

  const parserCode =
    useDeferredValue(`import { parseAsString, useQueryStates } from 'nuqs'

// One URL key per filterable column.
const filterParsers = {
  name: parseAsString,
  country: parseAsString
}

export function useFiltersQuery() {
  return useQueryStates(filterParsers)
}`)

  const usageCode =
    useDeferredValue(`import { useFiltersQuery } from './search-params.filtering.ts'
import {
  useReactTable,
  type ColumnFiltersState,
  type Updater
} from '@tanstack/react-table'

const [filters, setFilters] = useFiltersQuery()

// Map the query state object onto ColumnFiltersState
const columnFilters = Object.entries(filters)
  .filter(([, value]) => value !== null)
  .map(([id, value]) => ({ id, value }))

function onColumnFiltersChange(updaterOrValue: Updater<ColumnFiltersState>) {
  const next = typeof updaterOrValue === 'function'
    ? updaterOrValue(columnFilters)
    : updaterOrValue
  // Clear every filter first, so removed filters are also removed from the URL.
  void setFilters({
    name: null,
    country: null,
    ...Object.fromEntries(next.map(({ id, value }) => [id, value as string]))
  })
}

const table = useReactTable({
  ...otherProps,
  onColumnFiltersChange,
  state: {
    ...otherState,
    columnFilters,
  }
})`)

  return (
    <section className="not-prose">
      <div className="flex w-full flex-wrap items-end justify-start gap-2 rounded-xl border border-dashed p-2">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <FilterInput
            id="name"
            value={filters.name ?? ''}
            onChange={value => setFilters({ name: value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <FilterInput
            id="country"
            value={filters.country ?? ''}
            onChange={value => setFilters({ country: value })}
          />
        </div>
        <Button
          variant="secondary"
          disabled={columnFilters.length === 0}
          onClick={() => setFilters(null)}
        >
          Clear
        </Button>
      </div>
      <div className="mt-4 flex flex-col gap-6 xl:flex-row">
        <div className="flex min-w-0 flex-1 flex-col">
          <CodeBlock
            title="search-params.filtering.ts"
            lang="ts"
            icon={<TsLogo />}
            code={parserCode}
          />
          <CodeBlock
            title="table.tsx"
            lang="tsx"
            icon={<TsLogo />}
            code={usageCode}
          />
        </div>
        <aside className="w-full space-y-4 xl:w-72">
          <QuerySpy className="rounded-md" keepKeys={['name', 'country']} />
          <CodeBlock
            allowCopy={false}
            title="Internal state"
            code={internalState}
          />
        </aside>
      </div>
    </section>
  )
}
