'use client'

import { CodeBlock } from '@/src/components/code-block.client'
import { TsLogo } from '@/src/components/icons/ts-logo'
import { Querystring } from '@/src/components/querystring'
import { Label } from '@/src/components/ui/label'
import {
  Pagination,
  PaginationButton,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious
} from '@/src/components/ui/pagination'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/src/components/ui/select'
import { Separator } from '@/src/components/ui/separator'
import {
  createParser,
  parseAsInteger,
  parseAsString,
  useQueryState
} from 'nuqs'
import { useDeferredValue } from 'react'

const NUM_PAGES = 5

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

export function TanStackTablePagination() {
  const [pageIndexUrlKey, setPageIndexUrlKey] = useQueryState(
    'pageIndexUrlKey',
    parseAsString.withDefault('page')
  )
  const [pageSizeUrlKey, setPageSizeUrlKey] = useQueryState(
    'pageSizeUrlKey',
    parseAsString.withDefault('perPage')
  )
  const [page, setPage] = useQueryState(
    pageIndexUrlKey,
    pageIndexParser.withDefault(0)
  )
  const [pageSize, setPageSize] = useQueryState(
    pageSizeUrlKey,
    parseAsInteger.withDefault(10)
  )
  const [separator, setSeparator] = useQueryState(
    'separator',
    parseAsString.withDefault(',')
  )
  const [paginationKey, setPaginationKey] = useQueryState(
    'paginationKey',
    parseAsString.withDefault('pagination')
  )

  const queryStatesCode =
    useDeferredValue(`import { parseAsInteger, useQueryStates } from 'nuqs'

const paginationParsers = {
  pageIndex: parseAsInteger.withDefault(1),
  pageSize: parseAsInteger.withDefault(10)
}

const paginationUrlKeys = {
  pageIndex: '${pageIndexUrlKey}',
  pageSize: '${pageSizeUrlKey}'
}

export function usePaginationQuery() {
  return useQueryStates(paginationParsers, {
    urlKeys: paginationUrlKeys
  })
}
`)

  const queryStatesUsageCode =
    useDeferredValue(`import { usePaginationQuery } from './search-params.pagination.ts'
import {
  useReactTable,
  type PaginationState,
  type Updater
} from '@tanstack/react-table'

const [paginationQuery, setPaginationQuery] = usePaginationQuery()

function onPaginationChange(updaterOrValue: Updater<PaginationState>) {
  const newPagination = typeof updaterOrValue === "function"
    ? updaterOrValue(pagination)
    : updaterOrValue
  void setPaginationQuery(newPagination)
}

const pagination = {
  pageIndex: paginationQuery.pageIndex - 1,
  pageSize: paginationQuery.pageSize,
}

const table = useReactTable({
  ...otherProps,
  onPaginationChange,
  state: {
    ...otherState,
    pagination,
  }
})
  `)

  const internalState = useDeferredValue(`{
  // zero-indexed
  pageIndex: ${page},
  pageSize: ${pageSize}
}`)

  const customParserCode =
    useDeferredValue(`import { parseAsInteger, useQueryState } from 'nuqs'
import type { PaginationState } from '@tanstack/react-table'

const defaultState: PaginationState = {
  pageIndex: 1,
  pageSize: 10
}

const paginationParser = createParser<PaginationState>({
  parse: (value) => {
    const [pageIndex, pageSize] = value.split('${separator}')
    return {
      pageIndex: parseInt(pageIndex ?? \`\${defaultState.pageIndex}\`) - 1,
      pageSize: parseInt(pageSize ?? \`\${defaultState.pageSize}\`)
    }
  },
  serialize: (value) => {
    return \`\${value.pageIndex + 1}${separator}\${value.pageSize}\`
  },
})

export function usePaginationQuery() {
  return useQueryState('${paginationKey}', paginationParser
    .withDefault(defaultState)
  )
}`)

  const customParserUsageCode =
    useDeferredValue(`import { usePaginationQuery } from './search-params.pagination.ts'
import {
  useReactTable,
  type PaginationState,
  type Updater
} from '@tanstack/react-table'

const [pagination, setPagination] = usePaginationQuery()

function onPaginationChange(updaterOrValue: Updater<PaginationState>) {
  const newPagination = typeof updaterOrValue === 'function'
    ? updaterOrValue(pagination)
    : updaterOrValue
  void setPagination(newPagination)
}

const table = useReactTable({
  ...otherProps,
  onPaginationChange,
  state: {
    ...otherState,
    pagination,
  }
})`)

  return (
    <section>
      <h2>Pagination with custom url key names</h2>
      <p>
        This strategy uses 2 different url keys for pagination, you can use
        custom names instead of the default `pageIndex` and `pageSize`.
      </p>
      <div className="flex flex-wrap items-center justify-start gap-2 rounded-xl border border-dashed p-1">
        <Pagination className="not-prose mx-0 w-auto items-center gap-2">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                disabled={page <= 0}
                onClick={() => setPage(p => Math.max(0, p - 1))}
              />
            </PaginationItem>
            {Array.from({ length: NUM_PAGES }, (_, index) => (
              <PaginationItem key={index}>
                <PaginationButton
                  isActive={page === index}
                  onClick={() => setPage(index)}
                >
                  {index + 1}
                </PaginationButton>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                disabled={page >= NUM_PAGES - 1}
                onClick={() => setPage(p => Math.min(NUM_PAGES - 1, p + 1))}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
        <Label className="ml-auto flex items-center gap-2">
          Items per page
          <Select
            value={pageSize.toFixed()}
            onValueChange={value => setPageSize(parseInt(value))}
          >
            <SelectTrigger className="w-24">
              <SelectValue placeholder="10" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </Label>
      </div>
      <div className="flex flex-col gap-6 xl:flex-row">
        <div className="flex flex-col">
          <CodeBlock
            title="search-params.pagination.ts"
            lang="ts"
            icon={<TsLogo />}
            code={queryStatesCode}
          />
          <CodeBlock
            title="table.tsx"
            lang="ts"
            icon={<TsLogo />}
            code={queryStatesUsageCode}
          />
        </div>
        <aside className="w-full space-y-4 xl:w-64">
          <Querystring
            value={`?${pageIndexUrlKey}=${page + 1}&${pageSizeUrlKey}=${pageSize}`}
          />
          <CodeBlock
            allowCopy={false}
            title="Internal state"
            code={internalState}
          />
          <Separator className="my-8" />
          <div className="space-y-2">
            <Label htmlFor="pageIndexKey">Page index URL key</Label>
            <input
              id="pageIndexKey"
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={pageIndexUrlKey}
              onChange={e => {
                setPage(null)
                setPageIndexUrlKey(e.target.value)
              }}
              placeholder="e.g., page"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pageSizeKey">Page size URL key</Label>
            <input
              id="pageSizeKey"
              value={pageSizeUrlKey}
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              onChange={e => {
                setPageSize(null)
                setPageSizeUrlKey(e.target.value)
              }}
              placeholder="e.g., limit"
            />
          </div>
        </aside>
      </div>
      <Separator className="my-8" />
      <h2>Pagination with custom url key and separator</h2>
      <p>
        This strategy uses a single url key for pagination, and uses a separator
        to differentiate between the index and size.
      </p>
      <div className="flex flex-wrap items-center justify-start gap-2 rounded-xl border border-dashed p-1">
        <Pagination className="not-prose mx-0 w-auto items-center gap-2">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                disabled={page <= 0}
                onClick={() => setPage(p => Math.max(0, p - 1))}
              />
            </PaginationItem>
            {Array.from({ length: NUM_PAGES }, (_, index) => (
              <PaginationItem key={index}>
                <PaginationButton
                  isActive={page === index}
                  onClick={() => setPage(index)}
                >
                  {index + 1}
                </PaginationButton>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                disabled={page >= NUM_PAGES - 1}
                onClick={() => setPage(p => Math.min(NUM_PAGES - 1, p + 1))}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
        <Label className="ml-auto flex items-center gap-2">
          Items per page
          <Select
            value={pageSize.toFixed()}
            onValueChange={value => setPageSize(parseInt(value))}
          >
            <SelectTrigger className="w-24">
              <SelectValue placeholder="10" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </Label>
      </div>
      <div className="flex flex-col gap-6 xl:flex-row">
        <div className="flex flex-col">
          <CodeBlock
            title="search-params.pagination.ts"
            lang="ts"
            icon={<TsLogo />}
            code={customParserCode}
          />
          <CodeBlock
            title="table.ts"
            lang="tsx"
            icon={<TsLogo />}
            code={customParserUsageCode}
          />
        </div>
        <aside className="w-full space-y-4 xl:w-64">
          <Querystring
            value={`?${paginationKey}=${page + 1}${encodeURIComponent(separator).toString()}${pageSize}`}
          />
          <CodeBlock
            allowCopy={false}
            title="Internal state"
            code={internalState}
          />
          <Separator className="my-8" />
          <div className="space-y-2">
            <Label htmlFor="paginationKey">Pagination URL key</Label>
            <input
              id="paginationKey"
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={paginationKey}
              onChange={e => {
                setPaginationKey(e.target.value)
              }}
              placeholder="e.g., pagination"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="paginationSeparator">URL key separator</Label>
            <input
              id="paginationSeparator"
              value={separator}
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              onChange={e => {
                setSeparator(e.target.value)
              }}
              placeholder="e.g., limit"
            />
          </div>
        </aside>
      </div>
    </section>
  )
}
