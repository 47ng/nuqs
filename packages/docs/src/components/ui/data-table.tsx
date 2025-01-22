'use client'

import {
  flexRender,
  RowData,
  Table as TanStackTable
} from '@tanstack/react-table'

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow
} from '@/src/components/ui/table'

interface DataTableProps<TData extends RowData> {
  table: TanStackTable<TData>
}

export function DataTable<TData extends RowData>({
  table
}: DataTableProps<TData>) {
  return (
    <TableContainer className="max-h-96 overflow-y-auto rounded-md border">
      <Table className="border-separate border-spacing-0">
        <TableHeader className="sticky top-0 z-10 bg-background [&_tr>*]:border-b">
          {table.getHeaderGroups().map(headerGroup => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody className="[&_tr:last-child>*]:border-0 [&_tr>*]:border-b">
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map(row => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && 'selected'}
              >
                {row.getVisibleCells().map(cell => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={table.getAllColumns().length}
                className="h-24 text-center"
              >
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
