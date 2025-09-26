'use client'

import { CodeBlock } from '@/src/components/code-block.client'
import { QuerySpy } from '@/src/components/query-spy'
import { ContainerQueryHelper } from '@/src/components/responsive-helpers'
import { Button } from '@/src/components/ui/button'
import { Checkbox } from '@/src/components/ui/checkbox'
import {
  Pagination,
  PaginationButton,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious
} from '@/src/components/ui/pagination'
import { Slider } from '@/src/components/ui/slider'
import { cn } from '@/src/lib/utils'
import {
  ChevronDown,
  ChevronUp,
  Dices,
  Minus,
  Star,
  Trash2
} from 'lucide-react'
import {
  createMultiParser,
  createParser,
  parseAsBoolean,
  parseAsFloat,
  parseAsHex,
  parseAsIndex,
  parseAsInteger,
  parseAsIsoDate,
  parseAsIsoDateTime,
  parseAsJson,
  parseAsNativeArrayOf,
  parseAsStringLiteral,
  parseAsTimestamp,
  ParserBuilder,
  SingleParser,
  useQueryState
} from 'nuqs'
import React from 'react'
import { z } from 'zod'

export function DemoFallback() {
  return (
    <section className="flex h-[100px] animate-pulse items-center justify-center rounded-xl border border-dashed text-zinc-500 sm:h-[104px]">
      Demo loading...
    </section>
  )
}

type DemoContainerProps = React.ComponentProps<'section'> & {
  demoKey: string
}

function DemoContainer({
  children,
  className,
  demoKey,
  ...props
}: DemoContainerProps) {
  return (
    <section
      className={cn(
        'not-prose flex flex-wrap items-center gap-2 rounded-xl border border-dashed p-2',
        className
      )}
      {...props}
    >
      <QuerySpy className="rounded-md" keepKeys={[demoKey]} />
      {children}
    </section>
  )
}

export function BasicUsageDemo() {
  const [name, setName] = useQueryState('name', { defaultValue: '' })
  return (
    <DemoContainer className="flex-col items-stretch" demoKey="name">
      <input
        className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring h-10 flex-1 rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        value={name}
        onChange={e => setName(e.target.value || null)}
        placeholder="Enter your name..."
        autoComplete="off"
      />
      <div className="flex flex-1 items-center gap-2">
        <span className="mr-auto ml-2 text-sm text-zinc-500">
          {`Hello, ${name || 'anonymous visitor'}!`}
        </span>
        <Button variant="secondary" onClick={() => setName(null)}>
          Clear
        </Button>
      </div>
    </DemoContainer>
  )
}

export function StringParserDemo() {
  const [value, setValue] = useQueryState('string', { defaultValue: '' })
  return (
    <DemoContainer demoKey="string">
      <input
        className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring h-10 flex-1 rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        value={value}
        onChange={e => setValue(e.target.value || null)}
        placeholder="Type something here..."
        autoComplete="off"
      />
      <Button
        variant="secondary"
        onClick={() => setValue(null)}
        className="ml-auto"
      >
        Clear
      </Button>
    </DemoContainer>
  )
}

export function IntegerParserDemo() {
  const [value, setValue] = useQueryState('int', parseAsInteger)
  return (
    <DemoContainer demoKey="int">
      <input
        type="number"
        className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 flex-1 rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        value={value ?? ''} // Handle empty input
        onChange={e => {
          if (e.target.value === '') {
            setValue(null)
          } else {
            setValue(e.target.valueAsNumber)
          }
        }}
        placeholder="What's your favourite number?"
        autoComplete="off"
      />
      <Button
        variant="secondary"
        onClick={() => setValue(null)}
        className="ml-auto"
      >
        Clear
      </Button>
    </DemoContainer>
  )
}

export function FloatParserDemo() {
  const [value, setValue] = useQueryState(
    'float',
    parseAsFloat.withDefault(0).withOptions({ throttleMs: 100 })
  )
  return (
    <DemoContainer demoKey="float">
      <Slider
        value={[value]}
        onValueChange={([v]) => setValue(v).catch()}
        className="w-auto flex-1"
        min={-1}
        max={1}
        step={0.001}
      />
      <Button variant="secondary" onClick={() => setValue(null)}>
        Clear
      </Button>
    </DemoContainer>
  )
}

export function HexParserDemo() {
  const [value, setValue] = useQueryState(
    'hex',
    parseAsHex.withDefault(0).withOptions({ throttleMs: 100 })
  )
  return (
    <DemoContainer demoKey="hex">
      <Slider
        value={[value]}
        onValueChange={([v]) => setValue(v).catch(console.error)}
        className="w-auto flex-1"
        min={0}
        max={255}
      />
      <Button variant="secondary" onClick={() => setValue(null)}>
        Clear
      </Button>
    </DemoContainer>
  )
}

export function IndexParserDemo() {
  const numPages = 5
  const [pageIndex, setPageIndex] = useQueryState(
    'page',
    parseAsIndex.withDefault(0).withOptions({ clearOnDefault: false })
  )
  return (
    <DemoContainer demoKey="page">
      <Pagination className="not-prose items-center gap-2">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              disabled={pageIndex === 0}
              onClick={() => setPageIndex(p => Math.max(0, p - 1))}
            />
          </PaginationItem>
          {Array.from({ length: numPages }, (_, i) => (
            <PaginationItem key={i}>
              <PaginationButton
                isActive={pageIndex === i}
                onClick={() => setPageIndex(i)}
              >
                {i + 1}
              </PaginationButton>
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext
              disabled={pageIndex === numPages - 1}
              onClick={() => setPageIndex(p => Math.min(numPages - 1, p + 1))}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
      <CodeBlock
        className="-mx-1 my-0 -mb-1 flex-1 border-none"
        code={`pageIndex: ${pageIndex} // internal state is zero-indexed`}
        allowCopy={false}
      />
      <Button
        variant="secondary"
        onClick={() => setPageIndex(null)}
        className="ml-auto"
      >
        Clear
      </Button>
    </DemoContainer>
  )
}

export function BooleanParserDemo() {
  const [value, setValue] = useQueryState(
    'bool',
    parseAsBoolean.withDefault(false)
  )
  return (
    <DemoContainer demoKey="bool">
      <Checkbox
        id="boolean-demo"
        checked={value ?? false}
        onCheckedChange={e => setValue(Boolean(e))}
        className="ml-3"
      />
      <label
        htmlFor="boolean-demo"
        className="text-sm leading-none font-medium select-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        Checked: <code>{String(value)}</code>
      </label>
      <Button
        variant="secondary"
        className="ml-auto"
        onClick={() => setValue(null)}
      >
        Clear
      </Button>
    </DemoContainer>
  )
}

export function StringLiteralParserDemo() {
  const [value, setValue] = useQueryState(
    'sort',
    parseAsStringLiteral(['asc', 'desc'])
  )
  return (
    <DemoContainer demoKey="sort">
      <Button
        onClick={() =>
          setValue(old => {
            if (old === 'asc') {
              return 'desc'
            }
            if (old === 'desc') {
              return 'asc'
            }
            return 'asc'
          })
        }
      >
        {value === 'asc' ? (
          <ChevronUp className="mr-2" />
        ) : value === 'desc' ? (
          <ChevronDown className="mr-2" />
        ) : (
          <Minus className="mr-2" />
        )}
        {value === null ? (
          <span>No order defined</span>
        ) : (
          <span>Sort {value === 'asc' ? 'Ascending' : 'Descending'}</span>
        )}
      </Button>
      <Button
        variant="secondary"
        className="ml-auto"
        onClick={() => setValue(null)}
      >
        Clear
      </Button>
    </DemoContainer>
  )
}

export function DateParserDemo({
  queryKey,
  parser,
  type
}: {
  queryKey: string
  parser: ParserBuilder<Date>
  type: 'date' | 'datetime-local'
}) {
  const [value, setValue] = useQueryState(queryKey, parser)
  return (
    <DemoContainer className="@container relative" demoKey={queryKey}>
      <ContainerQueryHelper />
      <div className="flex w-full flex-col items-stretch gap-2 @md:flex-row">
        <div className="flex flex-1 items-center gap-2">
          <input
            type={type}
            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 flex-[2] rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            value={
              value?.toISOString().slice(0, type === 'date' ? 10 : 19) ?? ''
            }
            onChange={e => {
              if (e.target.value === '') {
                setValue(null)
              } else {
                // Force back the date to UTC to avoid lossy SerDe conversion.
                // We could use the valueAsDate, but it's not supported in Chrome.
                // See https://github.com/47ng/nuqs/pull/704
                setValue(new Date(e.target.value + 'Z'))
              }
            }}
          />
          <span className="px-2 font-medium text-zinc-500">UTC</span>
        </div>
        <div className="flex flex-1 gap-2 @md:flex-initial">
          <Button
            className="w-full @md:w-auto"
            onClick={() => setValue(new Date())}
          >
            Now
          </Button>
          <Button
            className="w-full @md:w-auto"
            variant="secondary"
            onClick={() => setValue(null)}
          >
            Clear
          </Button>
        </div>
      </div>
    </DemoContainer>
  )
}

export function DatetimeISOParserDemo() {
  return (
    <DateParserDemo
      type="datetime-local"
      queryKey="iso"
      parser={parseAsIsoDateTime}
    />
  )
}

export function DateISOParserDemo() {
  return <DateParserDemo type="date" queryKey="date" parser={parseAsIsoDate} />
}

export function DateTimestampParserDemo() {
  return (
    <DateParserDemo
      type="datetime-local"
      queryKey="ts"
      parser={parseAsTimestamp}
    />
  )
}

const jsonParserSchema = z.object({
  pkg: z.string(),
  version: z.number(),
  worksWith: z.array(z.string())
})

export function JsonParserDemo() {
  const [value, setValue] = useQueryState('json', parseAsJson(jsonParserSchema))
  return (
    <DemoContainer demoKey="json" className="items-start">
      <pre className="bg-background flex-1 rounded-md border p-2 text-sm text-zinc-500">
        {JSON.stringify(value, null, 2)}
      </pre>
      <Button
        onClick={() =>
          setValue({
            pkg: 'nuqs',
            version: 2,
            worksWith: [
              'Next.js',
              'React',
              'Remix',
              'React Router',
              'TanStack Router',
              'and more'
            ]
          })
        }
      >
        Try it
      </Button>
      <Button
        variant="secondary"
        className="ml-auto"
        onClick={() => setValue(null)}
      >
        Clear
      </Button>
    </DemoContainer>
  )
}

const STAR = '★'
type Rating = 1 | 2 | 3 | 4 | 5

const parseAsStarRating = createParser({
  parse(queryValue) {
    const inBetween = queryValue.split(STAR)
    const isValid = inBetween.length > 1 && inBetween.every(s => s === '')
    if (!isValid) return null
    const numStars = inBetween.length - 1
    return Math.min(5, numStars) as Rating
  },
  serialize(value) {
    return Array.from({ length: value }, () => STAR).join('')
  }
})

export function CustomParserDemo() {
  const [value, setValue] = useQueryState('rating', parseAsStarRating)
  return (
    <DemoContainer demoKey="rating">
      <div className="group">
        <StarButton index={1} value={value} setValue={setValue} />
        <StarButton index={2} value={value} setValue={setValue} />
        <StarButton index={3} value={value} setValue={setValue} />
        <StarButton index={4} value={value} setValue={setValue} />
        <StarButton index={5} value={value} setValue={setValue} />
      </div>
      <Button
        variant="secondary"
        className="ml-auto"
        onClick={() => setValue(null)}
      >
        Clear
      </Button>
    </DemoContainer>
  )
}

export function NativeArrayParserDemo() {
  const [value, setValue] = useQueryState(
    'nativeArray',
    parseAsNativeArrayOf(parseAsInteger)
  )
  return (
    <DemoContainer demoKey="nativeArray">
      <Button
        onClick={() =>
          setValue(prev => prev.concat(Math.floor(Math.random() * 500) + 1))
        }
      >
        <Dices size={18} className="mr-2 inline-block" role="presentation" />
        Add random number
      </Button>
      <Button
        onClick={() => setValue(prev => prev.slice(0, -1))}
        disabled={value.length === 0}
      >
        <Trash2 size={16} className="mr-2 inline-block" role="presentation" />
        Remove last number
      </Button>
      <Button
        variant="secondary"
        onClick={() => setValue([])}
        className="ml-auto"
      >
        Clear
      </Button>
      <CodeBlock
        lang="json"
        code={JSON.stringify(value)}
        allowCopy={false}
        className="my-0 w-full"
      />
    </DemoContainer>
  )
}

export function CustomMultiParserDemo() {
  const parseAsFromTo = createParser({
    parse: value => {
      const [min = null, max = null] = value
        .split('~')
        .map(parseAsInteger.parse)
      if (min === null) return null
      if (max === null) return { eq: min }
      return { gte: min, lte: max }
    },
    serialize: value => {
      return value.eq !== undefined
        ? String(value.eq)
        : `${value.gte}~${value.lte}`
    }
  })

  const parseAsKeyValue = createParser({
    parse: value => {
      const [key, val] = value.split(':')
      if (!key || !val) return null
      return { key, value: val }
    },
    serialize: value => {
      return `${value.key}:${value.value}`
    }
  })

  const parseAsFilters = <TItem extends {}>(
    itemParser: SingleParser<TItem>
  ) => {
    return createMultiParser({
      parse: values => {
        const keyValue = values
          .map(parseAsKeyValue.parse)
          .filter(v => v !== null)

        const result = Object.fromEntries(
          keyValue.flatMap(({ key, value }) => {
            const parsedValue: TItem | null = itemParser.parse(value)
            return parsedValue === null ? [] : [[key, parsedValue]]
          })
        )

        return Object.keys(result).length === 0 ? null : result
      },
      serialize: values => {
        return Object.entries(values)
          .map(([key, value]) => {
            if (!itemParser.serialize) return null
            return parseAsKeyValue.serialize({
              key,
              value: itemParser.serialize(value)
            })
          })
          .filter(v => v !== null)
      }
    })
  }

  const [filters, setFilters] = useQueryState(
    'filters',
    parseAsFilters(parseAsFromTo).withDefault({})
  )

  return (
    <DemoContainer demoKey="filters">
      <div>
        <label className="text-sm leading-none font-medium select-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          Rating:
        </label>
        <input
          type="number"
          className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 flex-1 rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          value={filters.rating?.eq ?? ''}
          onChange={e => {
            setFilters(prev => ({
              ...prev,
              rating: { eq: e.target.valueAsNumber }
            }))
          }}
          autoComplete="off"
        />
      </div>
      <div>
        <label className="text-sm leading-none font-medium select-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          Price From:
        </label>
        <input
          type="number"
          className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 flex-1 rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          value={filters.price?.gte ?? 0}
          onChange={e => {
            setFilters(prev => ({
              ...prev,
              price: {
                lte: prev.price?.lte ?? 0,
                gte: e.target.value === '' ? 0 : e.target.valueAsNumber
              }
            }))
          }}
          autoComplete="off"
        />
      </div>
      <div>
        <label className="text-sm leading-none font-medium select-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          Price To:
        </label>
        <input
          type="number"
          className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 flex-1 rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          value={filters.price?.lte ?? 0}
          onChange={e => {
            setFilters(prev => ({
              ...prev,
              price: {
                gte: prev.price?.gte ?? 0,
                lte: e.target.value === '' ? 0 : e.target.valueAsNumber
              }
            }))
          }}
          autoComplete="off"
        />
      </div>
      <Button
        variant="secondary"
        onClick={() => setFilters(null)}
        className="mt-auto ml-auto"
      >
        Clear
      </Button>
    </DemoContainer>
  )

  return (
    <DemoContainer demoKey="filters">
      {Object.entries(filters).map(([key, value]) => {
        if (value.eq !== undefined) {
          return (
            <div key={key}>
              <label className="text-sm leading-none font-medium select-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                {key}:{' '}
              </label>
              <input
                key={key}
                type="number"
                className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 flex-1 rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                value={value.eq}
                onChange={e => {
                  setFilters(prev => ({
                    ...prev,
                    [key]: { eq: e.target.valueAsNumber }
                  }))
                }}
                placeholder="What's your favourite number?"
                autoComplete="off"
              />
            </div>
          )
        }
        return (
          <div key={key}>
            <label className="text-sm leading-none font-medium select-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              {key}:{' '}
            </label>
            <input
              key={key}
              type="number"
              className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 flex-1 rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              value={value.eq}
              onChange={e => {
                setFilters(prev => ({
                  ...prev,
                  [key]: { eq: e.target.valueAsNumber }
                }))
              }}
              placeholder="What's your favourite number?"
              autoComplete="off"
            />
          </div>
        )
      })}
      <Button
        variant="secondary"
        onClick={() => setFilters(null)}
        className="ml-auto"
      >
        Clear
      </Button>
    </DemoContainer>
  )
}

type StarButtonProps = Omit<React.ComponentProps<typeof Button>, 'value'> & {
  index: Rating
  value: Rating | null
  setValue: (value: Rating | null) => void
}

function StarButton({ index, value, setValue, ...props }: StarButtonProps) {
  return (
    <Button
      size="icon"
      variant="ghost"
      onClick={() => setValue(index)}
      {...props}
    >
      <Star
        className={cn(
          'star',
          value !== null && value >= index && 'fill-current'
        )}
      />
    </Button>
  )
}
