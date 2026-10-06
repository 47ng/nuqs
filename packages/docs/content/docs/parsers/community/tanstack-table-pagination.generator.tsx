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

const quote = (value: string) =>
  value.replaceAll('\\', '\\\\').replaceAll("'", "\\'")

const inTemplate = (value: string) =>
  value.replaceAll('\\', '\\\\').replaceAll('`', '\\`').replaceAll('${', '\\${')

const positivePageParser = createParser<number>({
  parse: value => {
    const page = Number(value)
    return Number.isInteger(page) && page >= 1 ? page - 1 : null
  },
  serialize: value => String(Math.round(value + 1))
})

const positiveIntegerParser = createParser<number>({
  parse: value => {
    const size = Number(value)
    return Number.isInteger(size) && size >= 1 ? size : null
  },
  serialize: value => String(Math.round(value))
})

type PaginationState = {
  pageIndex: number
  pageSize: number
}

function createPaginationParser(separator: string) {
  return createParser<PaginationState>({
    parse: value => {
      if (!separator) return null
      const index = value.indexOf(separator)
      if (
        index === -1 ||
        value.indexOf(separator, index + separator.length) !== -1
      ) {
        return null
      }
      const pageIndex = Number(value.slice(0, index))
      const pageSize = Number(value.slice(index + separator.length))
      if (
        !Number.isInteger(pageIndex) ||
        pageIndex < 1 ||
        !Number.isInteger(pageSize) ||
        pageSize < 1
      ) {
        return null
      }
      return { pageIndex: pageIndex - 1, pageSize }
    },
    serialize: ({ pageIndex, pageSize }) =>
      `${pageIndex + 1}${separator}${pageSize}`,
    eq: (a, b) => a.pageIndex === b.pageIndex && a.pageSize === b.pageSize
  })
}

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
    positivePageParser.withDefault(0)
  )
  const [pageSize, setPageSize] = useQueryState(
    pageSizeUrlKey,
    positiveIntegerParser.withDefault(10)
  )
  const [separator, setSeparator] = useQueryState(
    'paginationSeparator',
    parseAsString.withDefault(',')
  )
  const [paginationKey, setPaginationKey] = useQueryState(
    'paginationKey',
    parseAsString.withDefault('pagination')
  )
  const paginationParser = createPaginationParser(separator)
  // nuqs keeps the first parser it sees, so parse the raw value with the current separator.
  const [rawPagination, setRawPagination] = useQueryState(paginationKey)
  const defaultPagination = { pageIndex: 0, pageSize: 10 }
  const singlePagination =
    (rawPagination == null ? null : paginationParser.parse(rawPagination)) ??
    defaultPagination
  const setSinglePagination = (value: PaginationState | null) =>
    setRawPagination(
      value === null || paginationParser.eq(value, defaultPagination)
        ? null
        : paginationParser.serialize(value)
    )

  const queryStatesCode =
    useDeferredValue(`import { parseAsInteger, useQueryStates } from 'nuqs'

const paginationParsers = {
  // The URL is one-based while TanStack Table is zero-based.
  pageIndex: parseAsInteger.withDefault(1),
  pageSize: parseAsInteger.withDefault(10)
}

const paginationUrlKeys = {
  pageIndex: '${quote(pageIndexUrlKey)}',
  pageSize: '${quote(pageSizeUrlKey)}'
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
  useTable,
  type PaginationState,
  type Updater
} from '@tanstack/react-table'

const [paginationQuery, setPaginationQuery] = usePaginationQuery()

const pagination = {
  pageIndex: paginationQuery.pageIndex - 1,
  pageSize: paginationQuery.pageSize,
}

function onPaginationChange(updaterOrValue: Updater<PaginationState>) {
  const newPagination = typeof updaterOrValue === "function"
    ? updaterOrValue(pagination)
    : updaterOrValue
  void setPaginationQuery({
    ...newPagination,
    pageIndex: newPagination.pageIndex + 1,
  })
}

const table = useTable({
  ...otherProps,
  onPaginationChange,
  state: {
    ...otherState,
    pagination,
  }
})`)

  const internalState = useDeferredValue(`{
  // zero-indexed
  pageIndex: ${page},
  pageSize: ${pageSize}
}`)

  const customParserCode =
    useDeferredValue(`import { createParser, useQueryState } from 'nuqs'
import type { PaginationState } from '@tanstack/react-table'

const defaultState: PaginationState = {
  pageIndex: 0,
  pageSize: 10
}

const paginationParser = createParser<PaginationState>({
  parse: value => {
    const index = value.indexOf('${quote(separator)}')
    if (index === -1 || value.indexOf('${quote(separator)}', index + ${separator.length}) !== -1) {
      return null
    }
    const pageIndex = Number(value.slice(0, index))
    const pageSize = Number(value.slice(index + ${separator.length}))
    if (!Number.isInteger(pageIndex) || pageIndex < 1 || !Number.isInteger(pageSize) || pageSize < 1) {
      return null
    }
    return { pageIndex: pageIndex - 1, pageSize }
  },
  serialize: ({ pageIndex, pageSize }) => \`\${pageIndex + 1}${inTemplate(separator)}\${pageSize}\`,
  eq: (a, b) => a.pageIndex === b.pageIndex && a.pageSize === b.pageSize
})

export function usePaginationQuery() {
  return useQueryState('${quote(paginationKey)}', paginationParser
    .withDefault(defaultState)
  )
}`)

  const customParserUsageCode =
    useDeferredValue(`import { usePaginationQuery } from './search-params.pagination.ts'
import {
  useTable,
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

const table = useTable({
  ...otherProps,
  onPaginationChange,
  state: {
    ...otherState,
    pagination,
  }
})`)

  const customInternalState = useDeferredValue(`{
  // zero-indexed
  pageIndex: ${singlePagination.pageIndex},
  pageSize: ${singlePagination.pageSize}
}`)

  const customPage = singlePagination.pageIndex
  const customPageSize = singlePagination.pageSize
  const setCustomPage = (value: number | ((page: number) => number)) =>
    setSinglePagination({
      ...singlePagination,
      pageIndex: typeof value === 'function' ? value(customPage) : value
    })
  const setCustomPageSize = (pageSize: number) =>
    setSinglePagination({ ...singlePagination, pageSize })

  return (
    <section>
      <h3>Two URL keys</h3>
      <p>
        Store the page index and page size under two URL keys. You can rename
        them to something shorter than <code>pageIndex</code> and{' '}
        <code>pageSize</code>.
      </p>
      <div className="flex flex-wrap items-center justify-start gap-2 rounded-xl border border-dashed p-1">
        <Pagination className="not-prose mx-0 w-auto items-center gap-2">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                disabled={page <= 0}
                aria-label="Previous page"
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
                aria-label="Next page"
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
        <div className="flex min-w-0 flex-1 flex-col">
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
            value={`?${encodeURIComponent(pageIndexUrlKey)}=${page + 1}&${encodeURIComponent(pageSizeUrlKey)}=${pageSize}`}
          />
          <CodeBlock
            title="Internal state"
            code={internalState}
            allowCopy={false}
          />
          <Separator className="my-8" />
          <div className="space-y-2">
            <Label htmlFor="pageIndexKey">Page index URL key</Label>
            <input
              id="pageIndexKey"
              className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              value={pageIndexUrlKey}
              onChange={e => {
                setPage(null)
                setPageIndexUrlKey(e.target.value || null)
              }}
              placeholder="e.g., page"
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pageSizeKey">Page size URL key</Label>
            <input
              id="pageSizeKey"
              value={pageSizeUrlKey}
              className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              onChange={e => {
                setPageSize(null)
                setPageSizeUrlKey(e.target.value || null)
              }}
              placeholder="e.g., limit"
              autoComplete="off"
            />
          </div>
        </aside>
      </div>
      <Separator className="my-8" />
      <h3>A single URL key with a separator</h3>
      <p>
        Store both values under a single URL key, split by a separator of your
        choice.
      </p>
      <div className="flex flex-wrap items-center justify-start gap-2 rounded-xl border border-dashed p-1">
        <Pagination className="not-prose mx-0 w-auto items-center gap-2">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                disabled={customPage <= 0}
                aria-label="Previous page"
                onClick={() => setCustomPage(p => Math.max(0, p - 1))}
              />
            </PaginationItem>
            {Array.from({ length: NUM_PAGES }, (_, index) => (
              <PaginationItem key={index}>
                <PaginationButton
                  isActive={customPage === index}
                  onClick={() => setCustomPage(index)}
                >
                  {index + 1}
                </PaginationButton>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                disabled={customPage >= NUM_PAGES - 1}
                aria-label="Next page"
                onClick={() =>
                  setCustomPage(p => Math.min(NUM_PAGES - 1, p + 1))
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
        <Label className="ml-auto flex items-center gap-2">
          Items per page
          <Select
            value={customPageSize.toFixed()}
            onValueChange={value => setCustomPageSize(parseInt(value))}
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
        <div className="flex min-w-0 flex-1 flex-col">
          <CodeBlock
            title="search-params.pagination.ts"
            lang="ts"
            icon={<TsLogo />}
            code={customParserCode}
          />
          <CodeBlock
            title="table.tsx"
            lang="tsx"
            icon={<TsLogo />}
            code={customParserUsageCode}
          />
        </div>
        <aside className="w-full space-y-4 xl:w-64">
          <Querystring
            value={`?${encodeURIComponent(paginationKey)}=${customPage + 1}${encodeURIComponent(separator)}${customPageSize}`}
          />
          <CodeBlock
            allowCopy={false}
            title="Internal state"
            code={customInternalState}
          />
          <Separator className="my-8" />
          <div className="space-y-2">
            <Label htmlFor="paginationKey">Pagination URL key</Label>
            <input
              id="paginationKey"
              className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              value={paginationKey}
              onChange={e => {
                setSinglePagination(null)
                setPaginationKey(e.target.value || null)
              }}
              placeholder="e.g., pagination"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="paginationSeparator">Separator</Label>
            <input
              id="paginationSeparator"
              value={separator}
              className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              onChange={e => {
                setSinglePagination(null)
                setSeparator(e.target.value || null)
              }}
              placeholder="e.g., ~"
            />
          </div>
        </aside>
      </div>
    </section>
  )
}
