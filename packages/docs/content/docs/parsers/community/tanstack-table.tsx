'use client'

import { Button } from '@/src/components/ui/button'
import { faker } from '@faker-js/faker'
import {
  Column,
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  TableOptions,
  useReactTable
} from '@tanstack/react-table'
import { ArrowDown, ArrowUp } from 'lucide-react'

type Payment = {
  id: string
  amount: number
  status: 'pending' | 'processing' | 'success' | 'failed'
  email: string
  date: Date
  customer: string
  reference: string
  category: 'subscription' | 'one-time' | 'refund' | 'chargeback'
}

const columnHelper = createColumnHelper<Payment>()

interface DataTableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>
  title: string
}

const DataTableColumnHeader = <TData, TValue>({
  column,
  title
}: DataTableColumnHeaderProps<TData, TValue>) => (
  <Button
    variant="ghost"
    onClick={column.getToggleSortingHandler()}
    title={
      column.getCanSort()
        ? column.getNextSortingOrder() === 'asc'
          ? 'Sort ascending'
          : column.getNextSortingOrder() === 'desc'
            ? 'Sort descending'
            : 'Clear sort'
        : undefined
    }
  >
    {title}
    {column.getIsSorted() === 'asc' && <ArrowUp />}
    {column.getIsSorted() === 'desc' && <ArrowDown />}
  </Button>
)

const columns = [
  columnHelper.accessor('date', {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Date" />
    ),
    cell: ({ getValue }) => getValue().toLocaleDateString()
  }),
  columnHelper.accessor('reference', {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Reference" />
    ),
    cell: ({ getValue }) => <div className="font-mono">{getValue()}</div>
  }),
  columnHelper.accessor('customer', {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Customer" />
    )
  }),
  columnHelper.accessor('email', {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
    cell: ({ getValue }) => <div className="lowercase">{getValue()}</div>
  }),
  columnHelper.accessor('category', {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Category" />
    ),
    cell: ({ getValue }) => <div className="capitalize">{getValue()}</div>
  }),
  columnHelper.accessor('status', {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ getValue }) => <div className="capitalize">{getValue()}</div>
  }),
  columnHelper.accessor('amount', {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Amount" />
    ),
    cell: ({ getValue }) => {
      const amount = getValue()
      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(amount)
      return <div className="text-right font-medium">{formatted}</div>
    }
  })
]

export function generateData(length: number) {
  return Array.from({ length }, () => ({
    id: faker.string.uuid(),
    date: faker.date.recent({ days: 30 }),
    reference: faker.string.alphanumeric(10).toUpperCase(),
    customer: faker.person.fullName(),
    email: faker.internet.email(),
    amount: faker.number.int({ min: 100, max: 1000 }),
    status: faker.helpers.arrayElement([
      'pending',
      'processing',
      'success',
      'failed'
    ]),
    category: faker.helpers.arrayElement([
      'subscription',
      'one-time',
      'refund',
      'chargeback'
    ])
  })) satisfies Payment[]
}

export function useTanStackTable(
  options: Omit<
    TableOptions<Payment>,
    | 'columns'
    | 'getRowId'
    | 'getCoreRowModel'
    | 'getPaginationRowModel'
    | 'getSortedRowModel'
    | 'getFilteredRowModel'
  >
) {
  return useReactTable({
    columns,
    getRowId: row => row.id,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    ...options
  })
}
