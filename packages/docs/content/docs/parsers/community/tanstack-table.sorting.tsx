'use client'

import { CodeBlock } from '@/src/components/code-block.client'
import { Querystring } from '@/src/components/querystring'
import { TypescriptIcon } from '@/src/components/typescript-icon'
import { DataTable } from '@/src/components/ui/data-table'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { Separator } from '@/src/components/ui/separator'
import { parseAsString, useQueryState } from 'nuqs'
import { useDeferredValue } from 'react'
import { useSortingSearchParams } from './search-params.sorting'
import { generateData, useTanStackTable } from './tanstack-table'

const data = generateData(100)

export function TanStackTableSorting() {
  const [sortingUrlKey, setSortingUrlKey] = useQueryState(
    'sortingUrlKey',
    parseAsString.withDefault('orderBy')
  )

  const [sorting, setSorting] = useSortingSearchParams(sortingUrlKey)

  const parserCode =
    useDeferredValue(`import { ColumnSort, SortDirection } from '@tanstack/react-table'
import { createParser, parseAsArrayOf, useQueryState } from 'nuqs'

// Each sort is represented as \`columnId:direction\`,
// for example: \`?orderBy=email:desc,status:asc\`
const sortParser = createParser<ColumnSort>({
  parse: query => {
    const [id, direction] = query.split(':')
    return {
      id,
      desc: direction === 'desc'
    }
  },
  serialize: value =>
    \`\${value.id}:\${value.desc ? 'desc' : 'asc'}\` as \`\${string}:\${SortDirection}\`,
  // This is a simple equality check for comparing objects.
  // It works by converting both objects to strings and comparing them.
  // For more robust deep equality, consider using lodash's isEqual.
  eq: (a, b) => JSON.stringify(a) === JSON.stringify(b)
})

const parseAsSortingState = parseAsArrayOf(sortParser).withDefault([])

export function useSortingSearchParams(key = 'orderBy') {
  return useQueryState('${sortingUrlKey}', parseAsSortingState)
}`)

  const table = useTanStackTable({
    data,
    state: { sorting },
    onSortingChange: setSorting,
    enableFilters: false
  })

  const internalState = useDeferredValue(
    JSON.stringify(table.getState().sorting, null, 2)
  )

  return (
    <section>
      <div className="not-prose rounded-xl border border-dashed p-2">
        <DataTable table={table} />
      </div>
      <p className="mb-0">
        Configure and copy-paste this parser into your application:
      </p>
      <div className="flex flex-col gap-6 xl:flex-row">
        <CodeBlock
          title="search-params.sorting.ts"
          lang="ts"
          icon={<TypescriptIcon />}
          className="flex-grow"
          code={parserCode}
        />
        <aside className="w-full space-y-4 xl:w-64">
          <Querystring
            value={`?${sortingUrlKey}=${sorting
              ?.map(sort => `${sort.id}:${sort.desc ? 'desc' : 'asc'}`)
              .join(',')}`}
          />
          <CodeBlock
            allowCopy={false}
            title="Internal state"
            code={internalState}
          />
          <Separator className="my-8" />
          <div className="space-y-2">
            <Label htmlFor="sortingKey">Sorting URL key</Label>
            <Input
              id="sortingKey"
              value={sortingUrlKey}
              onChange={e => {
                setSorting([])
                setSortingUrlKey(e.target.value)
              }}
              placeholder="e.g., sortBy"
            />
          </div>
        </aside>
      </div>
    </section>
  )
}
