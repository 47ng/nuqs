'use client'

import { CodeBlock } from '@/src/components/code-block.client'
import { Querystring } from '@/src/components/querystring'
import { TypescriptIcon } from '@/src/components/typescript-icon'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/src/components/ui/select'
import { Separator } from '@/src/components/ui/separator'
import { parseAsString, useQueryState } from 'nuqs'
import { useDeferredValue } from 'react'
import { useColumnFiltersSearchParams } from './search-params.column-filters'
import { useTanStackTable } from './tanstack-table'

export function TanStackTableColumnFiltering() {
  const [columnFiltersUrlKey, setColumnFiltersUrlKey] = useQueryState(
    'columnFiltersUrlKey',
    parseAsString.withDefault('filter')
  )
  const [columnFilters, setColumnFilters] =
    useColumnFiltersSearchParams(columnFiltersUrlKey)

  const parserCode =
    useDeferredValue(`import { ColumnFilter } from '@tanstack/react-table'
import { createParser, parseAsArrayOf, useQueryState } from 'nuqs'

// Each column filter is represented as \`columnId=value\`,
// for example: \`?filter=email=john.doe@example.com&age=["7",null]\`
const filterParser = createParser({
  parse: query => {
    const [id, value] = query.split('=')
    return {
      id,
      value: JSON.parse(value ?? '')
    } as ColumnFilter
  },
  serialize: value => \`\${value.id}=\${JSON.stringify(value.value)}\`,
  // This is a simple equality check for comparing objects.
  // It works by converting both objects to strings and comparing them.
  // For more robust deep equality, consider using lodash's isEqual.
  eq: (a, b) => JSON.stringify(a) === JSON.stringify(b)
})

const parseAsColumnFiltersState = parseAsArrayOf(filterParser).withDefault([])

export function useColumnFiltersSearchParams() {
  return useQueryState('${columnFiltersUrlKey}', parseAsColumnFiltersState)
}`)

  const table = useTanStackTable({
    data: [],
    state: { columnFilters },
    onColumnFiltersChange: setColumnFilters,
    enableSorting: false
  })

  const internalState = useDeferredValue(
    JSON.stringify(table.getState().columnFilters, null, 2)
  )

  return (
    <section>
      <div className="not-prose flex flex-col gap-2 rounded-xl border border-dashed p-2">
        <div className="grid grid-cols-3 items-center gap-2">
          <Input
            placeholder="Filter emails..."
            type="search"
            className="col-span-2"
            value={(table.getColumn('email')?.getFilterValue() as string) ?? ''}
            onChange={event =>
              table.getColumn('email')?.setFilterValue(event.target.value)
            }
          />
          <Select
            value={
              (table.getColumn('status')?.getFilterValue() as string) ?? ''
            }
            onValueChange={value =>
              table.getColumn('status')?.setFilterValue(value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <p className="mb-0">
        Configure and copy-paste this parser into your application:
      </p>
      <div className="flex flex-col gap-6 xl:flex-row">
        <CodeBlock
          title="search-params.filtering.ts"
          lang="ts"
          icon={<TypescriptIcon />}
          className="flex-grow"
          code={parserCode}
        />
        <aside className="w-full space-y-4 xl:w-64">
          <Querystring
            value={`?${columnFiltersUrlKey}=${columnFilters
              ?.map(filter => `${filter.id}=${JSON.stringify(filter.value)}`)
              .join('&')}`}
          />
          <CodeBlock
            allowCopy={false}
            title="Internal state"
            code={internalState}
          />
          <Separator className="my-8" />
          <div className="space-y-2">
            <Label htmlFor="columnFiltersKey">Column filters URL key</Label>
            <Input
              id="columnFiltersKey"
              value={columnFiltersUrlKey}
              onChange={e => {
                setColumnFilters([])
                setColumnFiltersUrlKey(e.target.value)
              }}
              placeholder="e.g., where"
            />
          </div>
        </aside>
      </div>
    </section>
  )
}
