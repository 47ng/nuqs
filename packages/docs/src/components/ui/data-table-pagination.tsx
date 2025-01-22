import { Label } from '@/src/components/ui/label'
import { Table } from '@tanstack/react-table'

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
import { ELLIPSIS, getTablePaginationRange } from '@/src/lib/react-table'

interface DataTablePaginationProps<TData> {
  table: Table<TData>
}

export function DataTablePagination<TData>({
  table
}: DataTablePaginationProps<TData>) {
  const paginationRange = getTablePaginationRange(table)

  return (
    <div className="flex flex-wrap items-center justify-between px-2">
      <Pagination className="not-prose mx-0 w-auto items-center gap-2">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              disabled={table.getState().pagination.pageIndex <= 0}
              onClick={() => table.setPageIndex(p => Math.max(0, p - 1))}
            />
          </PaginationItem>
          {paginationRange.map((page, index) => (
            <div key={index}>
              {page === ELLIPSIS ? (
                <span>…</span>
              ) : (
                <PaginationItem>
                  <PaginationButton
                    isActive={
                      table.getState().pagination.pageIndex === page - 1
                    }
                    onClick={() => table.setPageIndex(page - 1)}
                  >
                    {page}
                  </PaginationButton>
                </PaginationItem>
              )}
            </div>
          ))}
          <PaginationItem>
            <PaginationNext
              disabled={
                table.getState().pagination.pageIndex >=
                table.getPageCount() - 1
              }
              onClick={() =>
                table.setPageIndex(p =>
                  Math.min(table.getPageCount() - 1, p + 1)
                )
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
      <Label className="ml-auto flex items-center gap-2">
        Items per page
        <Select
          value={table.getState().pagination.pageSize.toFixed()}
          onValueChange={value => table.setPageSize(parseInt(value))}
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
  )
}
