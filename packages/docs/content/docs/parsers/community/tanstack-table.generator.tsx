'use client'

import { CodeBlock } from '@/src/components/code-block.client'
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
  parseAsIndex,
  parseAsInteger,
  parseAsString,
  useQueryState
} from 'nuqs'
import { useDeferredValue } from 'react'

const NUM_PAGES = 5

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
    parseAsIndex.withDefault(0)
  )
  const [pageSize, setPageSize] = useQueryState(
    pageSizeUrlKey,
    parseAsInteger.withDefault(10)
  )

  const parserCode = useDeferredValue(`import {
  parseAsIndex,
  parseAsInteger,
  parseAsString,
  useQueryStates
} from 'nuqs'

const paginationParsers = {
  pageIndex: parseAsIndex.withDefault(0),
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

  const internalState = useDeferredValue(`{
  // zero-indexed
  pageIndex: ${page},
  pageSize: ${pageSize}
}`)

  return (
    <section>
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
      <p className="mb-0">
        Configure and copy-paste this parser into your application:
      </p>
      <div className="flex flex-col gap-6 xl:flex-row">
        <CodeBlock
          title="search-params.pagination.ts"
          lang="ts"
          icon={
            <svg
              fill="none"
              viewBox="0 0 128 128"
              xmlns="http://www.w3.org/2000/svg"
              className="size-4"
              role="presentation"
            >
              <rect fill="currentColor" height="128" rx="6" width="128" />
              <path
                clipRule="evenodd"
                d="m74.2622 99.468v14.026c2.2724 1.168 4.9598 2.045 8.0625 2.629 3.1027.585 6.3728.877 9.8105.877 3.3503 0 6.533-.321 9.5478-.964 3.016-.643 5.659-1.702 7.932-3.178 2.272-1.476 4.071-3.404 5.397-5.786 1.325-2.381 1.988-5.325 1.988-8.8313 0-2.5421-.379-4.7701-1.136-6.6841-.758-1.9139-1.85-3.6159-3.278-5.1062-1.427-1.4902-3.139-2.827-5.134-4.0104-1.996-1.1834-4.246-2.3011-6.752-3.353-1.8352-.7597-3.4812-1.4975-4.9378-2.2134-1.4567-.7159-2.6948-1.4464-3.7144-2.1915-1.0197-.7452-1.8063-1.5341-2.3598-2.3669-.5535-.8327-.8303-1.7751-.8303-2.827 0-.9643.2476-1.8336.7429-2.6079s1.1945-1.4391 2.0976-1.9943c.9031-.5551 2.0101-.9861 3.3211-1.2929 1.311-.3069 2.7676-.4603 4.3699-.4603 1.1658 0 2.3958.0877 3.6928.263 1.296.1753 2.6.4456 3.911.8109 1.311.3652 2.585.8254 3.824 1.3806 1.238.5552 2.381 1.198 3.43 1.9285v-13.1051c-2.127-.8182-4.45-1.4245-6.97-1.819s-5.411-.5917-8.6744-.5917c-3.3211 0-6.4674.3579-9.439 1.0738-2.9715.7159-5.5862 1.8336-7.844 3.353-2.2578 1.5195-4.0422 3.4553-5.3531 5.8075-1.311 2.3522-1.9665 5.1646-1.9665 8.4373 0 4.1785 1.2017 7.7433 3.6052 10.6945 2.4035 2.9513 6.0523 5.4496 10.9466 7.495 1.9228.7889 3.7145 1.5633 5.375 2.323 1.6606.7597 3.0954 1.5486 4.3044 2.3668s2.1628 1.7094 2.8618 2.6736c.7.9643 1.049 2.06 1.049 3.2873 0 .9062-.218 1.7462-.655 2.5202s-1.1 1.446-1.9885 2.016c-.8886.57-1.9956 1.016-3.3212 1.337-1.3255.321-2.8768.482-4.6539.482-3.0299 0-6.0305-.533-9.0021-1.6-2.9715-1.066-5.7245-2.666-8.2591-4.799zm-23.5596-34.9136h18.2974v-11.5544h-51v11.5544h18.2079v51.4456h14.4947z"
                className="fill-background"
                fillRule="evenodd"
              />
            </svg>
          }
          className="flex-grow"
          code={parserCode}
        />
        <aside className="w-full space-y-4 xl:w-64">
          <Querystring
            value={`?${pageIndexUrlKey}=${page + 1}&${pageSizeUrlKey}=${pageSize}`}
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
              className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
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
              className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              onChange={e => {
                setPageSize(null)
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
