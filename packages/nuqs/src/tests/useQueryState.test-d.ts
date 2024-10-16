import { expectError, expectNotAssignable, expectType } from 'tsd'
import {
  parseAsBoolean,
  parseAsFloat,
  parseAsInteger,
  parseAsIsoDateTime,
  parseAsString,
  parseAsTimestamp,
  useQueryState
} from '../../dist'

// By default, queries have a `string` state, nullable (when no query parameter is present)
{
  const [state, setState] = useQueryState('foo')
  expectType<string | null>(state)
  setState('bar')
  setState(old => old?.toUpperCase() ?? null)
  const search = await setState('bar')
  expectType<URLSearchParams>(search)
}

// Accept only a single `history` option
{
  const [state, setState] = useQueryState('foo', { history: 'push' })
  expectType<string | null>(state)
  setState('bar')
  setState(old => old?.toUpperCase() ?? null)
  const search = await setState('bar')
  expectType<URLSearchParams>(search)
}

// Supported query types
{
  const [state] = useQueryState('string', parseAsString)
  expectType<string | null>(state)
}
{
  const [state] = useQueryState('integer', parseAsInteger)
  expectType<number | null>(state)
}
{
  const [state] = useQueryState('float', parseAsFloat)
  expectType<number | null>(state)
}
{
  const [state] = useQueryState('boolean', parseAsBoolean)
  expectType<boolean | null>(state)
}
{
  const [state] = useQueryState('boolean', parseAsTimestamp)
  expectType<Date | null>(state)
}
{
  const [state] = useQueryState('boolean', parseAsIsoDateTime)
  expectType<Date | null>(state)
}

// With default values, state is no longer nullable
{
  const [state] = useQueryState('string', parseAsString.withDefault('foo'))
  expectType<string>(state)
  expectNotAssignable<null>(state)
}
{
  const [state] = useQueryState('integer', parseAsInteger.withDefault(0))
  expectType<number>(state)
  expectNotAssignable<null>(state)
}
{
  const [state] = useQueryState('float', parseAsFloat.withDefault(0))
  expectType<number>(state)
  expectNotAssignable<null>(state)
}
{
  const [state] = useQueryState('boolean', parseAsBoolean.withDefault(false))
  expectType<boolean>(state)
  expectNotAssignable<null>(state)
}
{
  const [state] = useQueryState(
    'boolean',
    parseAsTimestamp.withDefault(new Date())
  )
  expectType<Date>(state)
  expectNotAssignable<null>(state)
}
{
  const [state] = useQueryState(
    'boolean',
    parseAsIsoDateTime.withDefault(new Date())
  )
  expectType<Date>(state)
  expectNotAssignable<null>(state)
}

// Default value can be spread in:
{
  const [state] = useQueryState('string', {
    ...parseAsString,
    defaultValue: 'foo'
  })
  expectType<string>(state)
  expectNotAssignable<null>(state)
}
{
  const [state] = useQueryState('integer', {
    ...parseAsInteger,
    defaultValue: 0
  })
  expectType<number>(state)
  expectNotAssignable<null>(state)
}
{
  const [state] = useQueryState('float', {
    ...parseAsFloat,
    defaultValue: 0
  })
  expectType<number>(state)
  expectNotAssignable<null>(state)
}
{
  const [state] = useQueryState('boolean', {
    ...parseAsBoolean,
    defaultValue: false
  })
  expectType<boolean>(state)
  expectNotAssignable<null>(state)
}
{
  const [state] = useQueryState('boolean', {
    ...parseAsTimestamp,
    defaultValue: new Date()
  })
  expectType<Date>(state)
  expectNotAssignable<null>(state)
}
{
  const [state] = useQueryState('boolean', {
    ...parseAsIsoDateTime,
    defaultValue: new Date()
  })
  expectType<Date>(state)
  expectNotAssignable<null>(state)
}

// Custom parsers --
{
  const [hex] = useQueryState('foo', {
    parse: input => parseInt(input, 16)
  })
  expectType<number | null>(hex)
}
{
  const [num] = useQueryState('foo', {
    parse: parseInt,
    serialize: value => value.toString(16)
  })
  expectType<number | null>(num)

  const [hex] = useQueryState('foo', {
    parse: (input: string) => parseInt(input, 16),
    serialize: value => value.toString(16)
  })
  expectType<number | null>(hex)

  const [len] = useQueryState('length', {
    parse: (input: string) => input.length,
    serialize: value => Array.from({ length: value }, () => '•').join('')
  })
  expectType<number | null>(len)
}
{
  const [hex] = useQueryState('foo', {
    parse: input => parseInt(input, 16),
    serialize: value => value.toString(16),
    defaultValue: 0x2a
  })
  expectType<number>(hex)
  expectNotAssignable<null>(hex)
}
{
  const [hex] = useQueryState('foo', {
    parse: input => parseInt(input, 16),
    defaultValue: 0x2a
  })
  expectType<number>(hex)
  expectNotAssignable<null>(hex)
}

// Allow setting `null` to clear the query
{
  const [, set] = useQueryState('foo')
  set(null)
  set(old => {
    expectType<string | null>(old)
    return null
  })
}
{
  const [, set] = useQueryState('foo', parseAsInteger)
  set(null)
  set(old => {
    expectType<number | null>(old)
    return null
  })
}
{
  const [, set] = useQueryState('foo', parseAsFloat.withDefault(0.2))
  set(null)
  set(old => {
    expectType<number>(old) // We know it's not null here
    return null // But we can return null to clear the query
  })
}

// Allow specifying just the default value for a string type
{
  useQueryState('foo', {
    defaultValue: 'bar'
  })
  const [val, set] = useQueryState('foo', {
    defaultValue: 'bar',
    history: 'push'
  })
  expectType<string>(val)
  set(null)
  set(old => {
    expectType<string>(old) // We know it's not null here
    return null // But we can return null to clear the query
  })
  expectError(() => {
    useQueryState('foo', {
      defaultValue: 2 // not allowed for other types
    })
  })
}

// Extend the parser with a builder pattern
{
  expectType<number | null>(useQueryState('foo', parseAsInteger)[0])
  expectType<number | null>(
    useQueryState('foo', parseAsInteger.withOptions({}))[0]
  )
  expectType<number>(useQueryState('foo', parseAsInteger.withDefault(0))[0])
  expectNotAssignable<null>(
    useQueryState('foo', parseAsInteger.withDefault(0))[0]
  )
  expectType<number>(
    useQueryState(
      'foo',
      parseAsInteger.withOptions({ scroll: true }).withDefault(1)
    )[0]
  )
  expectNotAssignable<null>(
    useQueryState(
      'foo',
      parseAsInteger.withOptions({ scroll: true }).withDefault(1)
    )[0]
  )
  expectNotAssignable<null>(
    useQueryState(
      'foo',
      parseAsInteger.withDefault(1).withOptions({ scroll: true })
    )[0]
  )
}

// Expect errors on misuse -----------------------------------------------------
{
  expectError(() => {
    useQueryState('foo', {
      parse: (str: string) => str.length,
      serialize: value => value.toUpperCase()
    })
  })
}
{
  expectError(() => {
    // parser not specified, defaults to string, should clash with explicit hook type
    useQueryState<number>('foo')
  })
}

// Set state to undefined
{
  const [, setFoo] = useQueryState('foo')
  const [, setBar] = useQueryState('bar', parseAsString.withDefault('egg'))
  expectError(() => setFoo(undefined))
  expectError(() => setBar(undefined))
  expectError(() => setFoo(() => undefined))
  expectError(() => setBar(() => undefined))
}
