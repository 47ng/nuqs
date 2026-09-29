'use client'

import { Button } from '@/src/components/ui/button'
import { Label } from '@/src/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/src/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/src/components/ui/table'
import {
  columnFilteringFeature,
  createColumnHelper,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_includesString,
  rowPaginationFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_basic,
  sortFn_text,
  tableFeatures,
  useTable,
  type ColumnFiltersState,
  type ColumnSort
} from '@tanstack/react-table'
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown
} from 'lucide-react'
import {
  createParser,
  parseAsArrayOf,
  parseAsIndex,
  parseAsInteger,
  parseAsString,
  useQueryState,
  useQueryStates
} from 'nuqs'
import { people, type Person } from './api'

// Renders a single sorted column as `id.asc` / `id.desc` in the URL.
const columnSortParser = createParser<ColumnSort>({
  parse: query => {
    const index = query.lastIndexOf('.')
    if (index === -1) {
      return null
    }
    const id = query.slice(0, index)
    const direction = query.slice(index + 1)
    if (!id || (direction !== 'asc' && direction !== 'desc')) {
      return null
    }
    return { id, desc: direction === 'desc' }
  },
  serialize: ({ id, desc }) => `${id}.${desc ? 'desc' : 'asc'}`
})

function SortableHeader({
  label,
  sorted,
  onClick
}: {
  label: string
  sorted: false | 'asc' | 'desc'
  onClick: (event: React.MouseEvent) => void
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="data-[state=open]:bg-accent -ml-3 h-8"
      onClick={onClick}
    >
      {label}
      {sorted === 'desc' ? (
        <ArrowDown className="ml-2 h-4 w-4" />
      ) : sorted === 'asc' ? (
        <ArrowUp className="ml-2 h-4 w-4" />
      ) : (
        <ChevronsUpDown className="ml-2 h-4 w-4" />
      )}
    </Button>
  )
}

const features = tableFeatures({
  columnFilteringFeature,
  rowSortingFeature,
  rowPaginationFeature,
  filteredRowModel: createFilteredRowModel(),
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  filterFns: { includesString: filterFn_includesString },
  sortFns: {
    alphanumeric: sortFn_alphanumeric,
    basic: sortFn_basic,
    text: sortFn_text
  }
})

const columnHelper = createColumnHelper<typeof features, Person>()

const columns = columnHelper.columns(
  (
    [
      ['name', 'Name'],
      ['age', 'Age'],
      ['country', 'Country'],
      ['city', 'City'],
      ['email', 'Email']
    ] as const
  ).map(([accessor, label]) =>
    columnHelper.accessor(accessor, {
      header: ({ column }) => (
        <SortableHeader
          label={label}
          sorted={column.getIsSorted()}
          onClick={column.getToggleSortingHandler()!}
        />
      )
    })
  )
)

export default function Client() {
  const [sorting, setSorting] = useQueryState(
    'sort',
    parseAsArrayOf(columnSortParser, ',').withDefault([])
  )
  const [filters, setFilters] = useQueryStates({
    name: parseAsString,
    country: parseAsString
  })
  const [pagination, setPagination] = useQueryStates({
    // One-based in the URL, zero-based for TanStack Table.
    pageIndex: parseAsIndex.withDefault(0),
    pageSize: parseAsInteger.withDefault(10)
  })

  const columnFilters: ColumnFiltersState = Object.entries(filters)
    .filter(([, value]) => value !== null)
    .map(([id, value]) => ({ id, value }))

  const table = useTable({
    features,
    data: people,
    columns,
    state: { sorting, columnFilters, pagination },
    onSortingChange: updater => {
      void setSorting(old =>
        typeof updater === 'function' ? updater(old) : updater
      )
    },
    onColumnFiltersChange: updater => {
      const next =
        typeof updater === 'function' ? updater(columnFilters) : updater
      const cleared = { name: null, country: null }
      const applied = Object.fromEntries(
        next.map(({ id, value }) => [id, value as string])
      )
      void setFilters({ ...cleared, ...applied })
    },
    onPaginationChange: updater => {
      void setPagination(old =>
        typeof updater === 'function' ? updater(old) : updater
      )
    }
  })

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-wrap items-end gap-2">
        <div className="space-y-2">
          <Label htmlFor="name-filter">Name</Label>
          <input
            id="name-filter"
            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-48 rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
            placeholder="Filter by name…"
            onChange={e =>
              table
                .getColumn('name')
                ?.setFilterValue(e.target.value || undefined)
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="country-filter">Country</Label>
          <input
            id="country-filter"
            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-48 rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            value={
              (table.getColumn('country')?.getFilterValue() as string) ?? ''
            }
            placeholder="Filter by country…"
            onChange={e =>
              table
                .getColumn('country')
                ?.setFilterValue(e.target.value || undefined)
            }
          />
        </div>
      </div>
      <p className="text-muted-foreground text-sm">
        Click a column header to sort it, hold{' '}
        <kbd className="rounded border px-1">Shift</kbd> to sort over multiple
        columns.
      </p>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : (
                      <table.FlexRender header={header} />
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map(row => (
                <TableRow key={row.id}>
                  {row.getAllCells().map(cell => (
                    <TableCell key={cell.id}>
                      <table.FlexRender cell={cell} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-4">
        <Label className="flex items-center gap-2">
          Rows per page
          <Select
            value={table.state.pagination.pageSize.toString()}
            onValueChange={value => table.setPageSize(Number(value))}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[5, 10, 20, 50].map(size => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Label>
        <span className="text-muted-foreground text-sm">
          Page {table.state.pagination.pageIndex + 1} of {table.getPageCount()}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            aria-label="Previous page"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Next page"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
