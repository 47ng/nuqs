'use client'

import { CodeBlock } from '@/src/components/code-block.client'
import { Querystring } from '@/src/components/querystring'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { Separator } from '@/src/components/ui/separator'
import { parseAsString, useQueryState } from 'nuqs'
import { useDeferredValue } from 'react'

import { TypescriptIcon } from '@/src/components/typescript-icon'
import { DataTablePagination } from '@/src/components/ui/data-table-pagination'
import { usePaginationSearchParams } from './search-params.pagination'
import { generateData, useTanStackTable } from './tanstack-table'

const data = generateData(50)

export function TanStackTablePagination() {
  const [pageIndexUrlKey, setPageIndexUrlKey] = useQueryState(
    'pageIndexUrlKey',
    parseAsString.withDefault('page')
  )
  const [pageSizeUrlKey, setPageSizeUrlKey] = useQueryState(
    'pageSizeUrlKey',
    parseAsString.withDefault('perPage')
  )

  const [pagination, setPagination] = usePaginationSearchParams({
    pageIndex: pageIndexUrlKey,
    pageSize: pageSizeUrlKey
  })

  const parserCode = useDeferredValue(`import {
  createParser,
  parseAsInteger,
  parseAsString,
  useQueryStates
} from 'nuqs'

// The page index parser is zero-indexed internally,
// but one-indexed when rendered in the URL,
// to align with your UI and what users might expect.
const pageIndexParser = createParser({
  parse: query => {
    const page = parseAsInteger.parse(query)
    return page === null ? null : page - 1
  },
  serialize: value => {
    return parseAsInteger.serialize(value + 1)
  }
})

const paginationParsers = {
  pageIndex: pageIndexParser.withDefault(0),
  pageSize: parseAsInteger.withDefault(10)
}
const paginationUrlKeys = {
  pageIndex: '${pageIndexUrlKey}',
  pageSize: '${pageSizeUrlKey}'
}

export function usePaginationSearchParams() {
  return useQueryStates(paginationParsers, {
    urlKeys: paginationUrlKeys
  })
}`)

  const table = useTanStackTable({
    data,
    state: { pagination },
    onPaginationChange: setPagination
  })

  const internalState = useDeferredValue(
    JSON.stringify(table.getState().pagination, null, 2)
  )

  return (
    <section>
      <div className="not-prose rounded-xl border border-dashed p-2">
        <DataTablePagination table={table} />
      </div>
      <p className="mb-0">
        Configure and copy-paste this parser into your application:
      </p>
      <div className="flex flex-col gap-6 xl:flex-row">
        <CodeBlock
          title="search-params.pagination.ts"
          lang="ts"
          icon={<TypescriptIcon />}
          className="flex-grow"
          code={parserCode}
        />
        <aside className="w-full space-y-4 xl:w-64">
          <Querystring
            value={`?${pageIndexUrlKey}=${pagination.pageIndex + 1}&${pageSizeUrlKey}=${pagination.pageSize}`}
          />
          <CodeBlock
            allowCopy={false}
            title="Internal state"
            code={internalState}
          />
          <Separator className="my-8" />
          <div className="space-y-2">
            <Label htmlFor="pageIndexKey">Page index URL key</Label>
            <Input
              id="pageIndexKey"
              value={pageIndexUrlKey}
              onChange={e => {
                setPagination(null)
                setPageIndexUrlKey(e.target.value)
              }}
              placeholder="e.g., page"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pageSizeKey">Page size URL key</Label>
            <Input
              id="pageSizeKey"
              value={pageSizeUrlKey}
              onChange={e => {
                setPagination(null)
                setPageSizeUrlKey(e.target.value)
              }}
              placeholder="e.g., limit"
            />
          </div>
        </aside>
      </div>
    </section>
  )
}
