'use client'

import { QuerySpy } from '@/src/app/playground/(demos)/_components/query-spy'
import { Button } from '@/src/components/ui/button'
import { Checkbox } from '@/src/components/ui/checkbox'
import { Slider } from '@/src/components/ui/slider'
import { ChevronDown, ChevronUp, Minus } from 'lucide-react'
import {
  parseAsBoolean,
  parseAsFloat,
  parseAsHex,
  parseAsInteger,
  parseAsStringLiteral,
  useQueryState
} from 'nuqs'

function ParserDemoContainer({ children }: { children: React.ReactNode }) {
  return (
    <section className="not-prose flex flex-wrap items-center gap-2 rounded-xl border border-dashed p-2">
      {children}
      <QuerySpy className="mt-0" />
    </section>
  )
}

export function StringParserDemo() {
  const [value, setValue] = useQueryState('string', { defaultValue: '' })
  return (
    <ParserDemoContainer>
      <>
        <input
          className="flex h-10 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          value={value}
          placeholder="Type something here..."
          onChange={e => setValue(e.target.value || null)}
        />
        <Button variant="secondary" onClick={() => setValue(null)}>
          Clear
        </Button>
      </>
    </ParserDemoContainer>
  )
}

export function IntegerParserDemo() {
  const [value, setValue] = useQueryState('int', parseAsInteger)
  return (
    <ParserDemoContainer>
      <>
        <input
          type="number"
          className="flex h-10 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          value={value ?? ''} // Handle empty input
          onChange={e => {
            if (e.target.value === '') {
              setValue(null)
            } else {
              setValue(e.target.valueAsNumber)
            }
          }}
          placeholder="What's your favourite number?"
        />
        <Button variant="secondary" onClick={() => setValue(null)}>
          Clear
        </Button>
      </>
    </ParserDemoContainer>
  )
}

export function FloatParserDemo() {
  const [value, setValue] = useQueryState(
    'float',
    parseAsFloat.withDefault(0).withOptions({ throttleMs: 100 })
  )
  return (
    <ParserDemoContainer>
      <>
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
      </>
    </ParserDemoContainer>
  )
}

export function HexParserDemo() {
  const [value, setValue] = useQueryState(
    'hex',
    parseAsHex.withDefault(0).withOptions({ throttleMs: 100 })
  )
  return (
    <ParserDemoContainer>
      <>
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
      </>
    </ParserDemoContainer>
  )
}

export function BooleanParserDemo() {
  const [value, setValue] = useQueryState('bool', parseAsBoolean)
  return (
    <ParserDemoContainer>
      <>
        <Checkbox
          id="boolean-demo"
          checked={value ?? false}
          onCheckedChange={e => setValue(Boolean(e))}
        />
        <label
          htmlFor="boolean-demo"
          className="select-none text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          State: <code>{String(value)}</code>
        </label>
        <Button
          variant="secondary"
          className="ml-auto"
          onClick={() => setValue(null)}
        >
          Clear
        </Button>
      </>
    </ParserDemoContainer>
  )
}

export function StringLiteralParserDemo() {
  const [value, setValue] = useQueryState(
    'sort',
    parseAsStringLiteral(['asc', 'desc'] as const)
  )
  return (
    <ParserDemoContainer>
      <>
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
      </>
    </ParserDemoContainer>
  )
}
