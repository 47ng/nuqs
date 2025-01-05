'use client'

import { CodeBlock } from '@/src/components/code-block.client'
import { DataTable } from '@/src/components/ui/data-table'
import { DataTablePagination } from '@/src/components/ui/data-table-pagination'
import { Input } from '@/src/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/src/components/ui/select'
import { useDeferredValue } from 'react'
import { useColumnFiltersSearchParams } from './search-params.column-filters'
import { usePaginationSearchParams } from './search-params.pagination'
import { useSortingSearchParams } from './search-params.sorting'
import { generateData, useTanStackTable } from './tanstack-table'
import { parseAsString } from 'nuqs'
import { useQueryState } from 'nuqs'

const data = generateData(100)

export function TanStackTableKitchenSink() {
  const [pageIndexUrlKey] = useQueryState(
    'pageIndexUrlKey',
    parseAsString.withDefault('page')
  )
  const [pageSizeUrlKey] = useQueryState(
    'pageSizeUrlKey',
    parseAsString.withDefault('perPage')
  )

  const [columnFiltersUrlKey] = useQueryState(
    'columnFiltersUrlKey',
    parseAsString.withDefault('filter')
  )

  const [sortingUrlKey] = useQueryState(
    'sortingUrlKey',
    parseAsString.withDefault('orderBy')
  )

  const [columnFilters, setColumnFilters] =
    useColumnFiltersSearchParams(columnFiltersUrlKey)
  const [pagination, setPagination] = usePaginationSearchParams({
    pageIndex: pageIndexUrlKey,
    pageSize: pageSizeUrlKey
  })
  const [sorting, setSorting] = useSortingSearchParams(sortingUrlKey)

  const table = useTanStackTable({
    data,
    state: {
      columnFilters,
      pagination,
      sorting
    },
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    onSortingChange: setSorting
  })

  const internalState = useDeferredValue(
    JSON.stringify(
      {
        columnFilters: table.getState().columnFilters,
        pagination: table.getState().pagination,
        sorting: table.getState().sorting
      },
      null,
      2
    )
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
        <DataTable table={table} />
        <DataTablePagination table={table} />
      </div>
      <CodeBlock
        allowCopy={false}
        title="Internal state"
        code={internalState}
      />
    </section>
  )
}
