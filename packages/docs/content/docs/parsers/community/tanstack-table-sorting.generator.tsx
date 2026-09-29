'use client'

import { CodeBlock } from '@/src/components/code-block.client'
import { TsLogo } from '@/src/components/icons/ts-logo'
import { QuerySpy } from '@/src/components/query-spy'
import { Button } from '@/src/components/ui/button'
import { Checkbox } from '@/src/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/src/components/ui/dropdown-menu'
import { Label } from '@/src/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/src/components/ui/select'
import { Separator } from '@/src/components/ui/separator'
import { ArrowDown, ArrowUp, ChevronsUpDown, X } from 'lucide-react'
import {
  createParser,
  parseAsArrayOf,
  parseAsBoolean,
  parseAsString,
  parseAsStringLiteral,
  useQueryState
} from 'nuqs'
import { useDeferredValue } from 'react'

type ColumnSort = {
  id: string
  desc: boolean
}

const columns = ['name', 'age', 'country', 'city'] as const

const directionRenderings = {
  'asc/desc': { asc: 'asc', desc: 'desc' },
  'a/d': { asc: 'a', desc: 'd' },
  '^/v': { asc: '^', desc: 'v' }
} as const

type DirectionRendering = keyof typeof directionRenderings

const quote = (value: string) =>
  value.replaceAll('\\', '\\\\').replaceAll("'", "\\'")

function createColumnSortParser(
  separator: string,
  { asc, desc }: { asc: string; desc: string }
) {
  return createParser<ColumnSort>({
    parse: query => {
      // Use lastIndexOf so column ids may contain the separator.
      const index = query.lastIndexOf(separator)
      if (index === -1) {
        return null
      }
      const id = query.slice(0, index)
      const direction = query.slice(index + separator.length)
      if (!id || (direction !== asc && direction !== desc)) {
        return null
      }
      return { id, desc: direction === desc }
    },
    serialize: ({ id, desc: isDesc }) =>
      `${id}${separator}${isDesc ? desc : asc}`
  })
}

const TableSortingHeader = ({
  name,
  sort,
  setSort,
  multiple
}: {
  name: string
  sort: ColumnSort[]
  setSort: (value: ColumnSort[] | null) => void
  multiple: boolean
}) => {
  const current = sort.find(s => s.id === name)

  const setColumnSort = (desc: boolean) => {
    const others = multiple ? sort.filter(s => s.id !== name) : []
    setSort([...others, { id: name, desc }])
  }

  const removeColumnSort = () => {
    const next = sort.filter(s => s.id !== name)
    setSort(next.length ? next : null)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="data-[state=open]:bg-accent h-8 capitalize focus-visible:outline-none"
        >
          <span>{name}</span>
          {current?.desc === true ? (
            <ArrowDown />
          ) : current?.desc === false ? (
            <ArrowUp />
          ) : (
            <ChevronsUpDown />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onClick={() => setColumnSort(false)}>
          <ArrowUp className="text-muted-foreground/70 h-3.5 w-3.5" />
          Asc
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setColumnSort(true)}>
          <ArrowDown className="text-muted-foreground/70 h-3.5 w-3.5" />
          Desc
        </DropdownMenuItem>
        {current && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={removeColumnSort}>
              <X className="text-muted-foreground/70 h-3.5 w-3.5" />
              Remove
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function TanStackTableSorting() {
  const [sortKey, setSortKey] = useQueryState(
    'sortKey',
    parseAsString.withDefault('sort')
  )
  const [separator, setSeparator] = useQueryState(
    'sortSeparator',
    parseAsString.withDefault('.')
  )
  const [listSeparator, setListSeparator] = useQueryState(
    'sortListSeparator',
    parseAsString.withDefault(',')
  )
  const [direction, setDirection] = useQueryState(
    'sortDirection',
    parseAsStringLiteral(
      Object.keys(directionRenderings) as DirectionRendering[]
    ).withDefault('asc/desc')
  )
  const [isMultiple, setMultiple] = useQueryState(
    'multiSort',
    parseAsBoolean.withDefault(false)
  )

  const labels = directionRenderings[direction]
  const sortParser = parseAsArrayOf(
    createColumnSortParser(separator, labels),
    listSeparator
  )
  // nuqs keeps the first parser it sees, so parse the raw value with the current format.
  const [rawSort, setRawSort] = useQueryState(sortKey)
  const sort = (rawSort == null ? null : sortParser.parse(rawSort)) ?? []
  const setSort = (value: ColumnSort[] | null) =>
    setRawSort(value?.length ? sortParser.serialize(value) : null)

  // Reset the current sort before changing the way it is rendered,
  // so the previous value isn't parsed with the new format.
  const resetThen = (fn: () => void) => {
    void setSort(null)
    fn()
  }

  const internalState = useDeferredValue(JSON.stringify(sort, null, 2))

  const parserCode =
    useDeferredValue(`import { createParser, parseAsArrayOf, useQueryState } from 'nuqs'
import type { ColumnSort } from '@tanstack/react-table'

const columnSortParser = createParser<ColumnSort>({
  parse: query => {
    // Use lastIndexOf so column ids may contain the separator.
    const index = query.lastIndexOf('${separator}')
    if (index === -1) return null
    const id = query.slice(0, index)
    const direction = query.slice(index + ${separator.length})
    if (!id || (direction !== '${labels.asc}' && direction !== '${labels.desc}')) {
      return null
    }
    return { id, desc: direction === '${labels.desc}' }
  },
  serialize: ({ id, desc }) =>
    \`\${id}${separator}\${desc ? '${labels.desc}' : '${labels.asc}'}\`
})

export function useSortingQuery() {
  return useQueryState(
    '${quote(sortKey)}',
    parseAsArrayOf(columnSortParser, '${listSeparator}').withDefault([])
  )
}`)

  const usageCode =
    useDeferredValue(`import { useSortingQuery } from './search-params.sorting.ts'
import {
  useTable,
  type SortingState,
  type Updater
} from '@tanstack/react-table'

const [sorting, setSorting] = useSortingQuery()

function onSortingChange(updaterOrValue: Updater<SortingState>) {
  const newSorting = typeof updaterOrValue === 'function'
    ? updaterOrValue(sorting)
    : updaterOrValue
  void setSorting(newSorting)
}

const table = useTable({
  ...otherProps,
  onSortingChange,
  state: {
    ...otherState,
    sorting,
  }
})`)

  return (
    <section className="not-prose">
      <div className="flex w-full items-center justify-start gap-2 rounded-xl border border-dashed p-2">
        <div className="flex h-10 flex-1 items-center justify-start gap-1 rounded-md border px-1">
          {columns.map(name => (
            <TableSortingHeader
              key={name}
              name={name}
              sort={sort}
              setSort={setSort}
              multiple={isMultiple}
            />
          ))}
        </div>
        <Button
          variant="secondary"
          disabled={sort.length === 0}
          onClick={() => setSort(null)}
        >
          Clear
        </Button>
      </div>
      <div className="mt-4 flex flex-col gap-6 xl:flex-row">
        <div className="flex min-w-0 flex-1 flex-col">
          <CodeBlock
            title="search-params.sorting.ts"
            lang="ts"
            icon={<TsLogo />}
            code={parserCode}
          />
          <CodeBlock
            title="table.tsx"
            lang="tsx"
            icon={<TsLogo />}
            code={usageCode}
          />
        </div>
        <aside className="w-full space-y-4 xl:w-72">
          <QuerySpy className="rounded-md" keepKeys={[sortKey]} />
          <CodeBlock
            allowCopy={false}
            title="Internal state"
            code={internalState}
          />
          <Separator className="my-8" />
          <div className="space-y-2">
            <Label htmlFor="sortKey">Sort URL key</Label>
            <input
              id="sortKey"
              className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              value={sortKey}
              placeholder="e.g., sort"
              onChange={e =>
                resetThen(() => setSortKey(e.target.value || null))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="separator">Column / direction separator</Label>
            <Select
              value={separator}
              onValueChange={value => resetThen(() => setSeparator(value))}
            >
              <SelectTrigger id="separator">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=".">. (dot)</SelectItem>
                <SelectItem value=":">: (colon)</SelectItem>
                <SelectItem value="~">~ (tilde)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="listSeparator">Separator between columns</Label>
            <Select
              value={listSeparator}
              onValueChange={value => resetThen(() => setListSeparator(value))}
            >
              <SelectTrigger id="listSeparator">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=",">, (comma)</SelectItem>
                <SelectItem value=";">; (semicolon)</SelectItem>
                <SelectItem value="|">| (pipe)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="direction">Direction format</Label>
            <Select
              value={direction}
              onValueChange={value =>
                resetThen(() => setDirection(value as DirectionRendering))
              }
            >
              <SelectTrigger id="direction">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(directionRenderings).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    {key}{' '}
                    <span className="text-muted-foreground">
                      (name{separator}
                      {value.desc})
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Label className="flex items-center gap-2">
            <Checkbox
              checked={isMultiple}
              onCheckedChange={checked =>
                resetThen(() => setMultiple(checked === true))
              }
            />
            Sort over multiple columns
          </Label>
        </aside>
      </div>
    </section>
  )
}
