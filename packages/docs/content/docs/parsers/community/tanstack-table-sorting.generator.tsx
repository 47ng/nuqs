'use client'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/src/components/ui/dropdown-menu'
import { parseAsJson, useQueryState } from 'nuqs'
import { Button } from '@/src/components/ui/button'
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'
import { QuerySpy } from '@/src/components/query-spy'
import { z } from 'zod'

const sortingSchema = z.object({
  id: z.string(),
  desc: z.boolean()
})

const useSortingSearchParams = () =>
  useQueryState('sort', parseAsJson(sortingSchema.parse))

const TableSortingHeader = ({ name }: { name: string }) => {
  const [sort, setSort] = useSortingSearchParams()

  const isActive = sort?.id === name

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 focus-visible:outline-none data-[state=open]:bg-accent"
        >
          <span>{name}</span>
          {isActive && sort?.desc === true ? (
            <ArrowDown />
          ) : isActive && sort?.desc === false ? (
            <ArrowUp />
          ) : (
            <ChevronsUpDown />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onClick={() => setSort({ id: name, desc: false })}>
          <ArrowUp className="h-3.5 w-3.5 text-muted-foreground/70" />
          Asc
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setSort({ id: name, desc: true })}>
          <ArrowDown className="h-3.5 w-3.5 text-muted-foreground/70" />
          Desc
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function TanStackTableSorting() {
  const [_, setSort] = useSortingSearchParams()

  return (
    <section className="not-prose flex flex-col items-center gap-2 rounded-xl border border-dashed p-2">
      <QuerySpy className="rounded-md" keepKeys={['sort']} />
      <div className="flex w-full items-center justify-start gap-2 rounded-xl">
        <div className="flex h-10 flex-1 items-center justify-start gap-2 rounded-md border">
          <TableSortingHeader name="name" />
          <TableSortingHeader name="age" />
        </div>
        <Button variant="secondary" onClick={() => setSort(null)}>
          Clear
        </Button>
      </div>
    </section>
  )
}
