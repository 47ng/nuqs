import { expectError, expectNotAssignable, expectType } from 'tsd'
import { queryTypes, useQueryState } from '../index'

// By default, queries have a `string` state, nullable (when no query parameter is present)
{
  const [state, setState] = useQueryState('foo')
  expectType<string | null>(state)
  setState('bar')
  setState(old => old?.toUpperCase() ?? null)
  const out = await setState('bar')
  expectType<boolean>(out)
}

// Accept only a single `history` option
{
  const [state, setState] = useQueryState('foo', { history: 'push' })
  expectType<string | null>(state)
  setState('bar')
  setState(old => old?.toUpperCase() ?? null)
  const out = await setState('bar')
  expectType<boolean>(out)
}

// Supported query types
{
  const [state] = useQueryState('string', queryTypes.string)
  expectType<string | null>(state)
}
{
  const [state] = useQueryState('integer', queryTypes.integer)
  expectType<number | null>(state)
}
{
  const [state] = useQueryState('float', queryTypes.float)
  expectType<number | null>(state)
}
{
  const [state] = useQueryState('boolean', queryTypes.boolean)
  expectType<boolean | null>(state)
}
{
  const [state] = useQueryState('boolean', queryTypes.timestamp)
  expectType<Date | null>(state)
}
{
  const [state] = useQueryState('boolean', queryTypes.isoDateTime)
  expectType<Date | null>(state)
}

// With default values, state is no longer nullable
{
  const [state] = useQueryState('string', queryTypes.string.withDefault('foo'))
  expectType<string>(state)
  expectNotAssignable<null>(state)
}
{
  const [state] = useQueryState('integer', queryTypes.integer.withDefault(0))
  expectType<number>(state)
  expectNotAssignable<null>(state)
}
{
  const [state] = useQueryState('float', queryTypes.float.withDefault(0))
  expectType<number>(state)
  expectNotAssignable<null>(state)
}
{
  const [state] = useQueryState(
    'boolean',
    queryTypes.boolean.withDefault(false)
  )
  expectType<boolean>(state)
  expectNotAssignable<null>(state)
}
{
  const [state] = useQueryState(
    'boolean',
    queryTypes.timestamp.withDefault(new Date())
  )
  expectType<Date>(state)
  expectNotAssignable<null>(state)
}
{
  const [state] = useQueryState(
    'boolean',
    queryTypes.isoDateTime.withDefault(new Date())
  )
  expectType<Date>(state)
  expectNotAssignable<null>(state)
}

// Default value can be spread in:
{
  const [state] = useQueryState('string', {
    ...queryTypes.string,
    defaultValue: 'foo'
  })
  expectType<string>(state)
  expectNotAssignable<null>(state)
}
{
  const [state] = useQueryState('integer', {
    ...queryTypes.integer,
    defaultValue: 0
  })
  expectType<number>(state)
  expectNotAssignable<null>(state)
}
{
  const [state] = useQueryState('float', {
    ...queryTypes.float,
    defaultValue: 0
  })
  expectType<number>(state)
  expectNotAssignable<null>(state)
}
{
  const [state] = useQueryState('boolean', {
    ...queryTypes.boolean,
    defaultValue: false
  })
  expectType<boolean>(state)
  expectNotAssignable<null>(state)
}
{
  const [state] = useQueryState('boolean', {
    ...queryTypes.timestamp,
    defaultValue: new Date()
  })
  expectType<Date>(state)
  expectNotAssignable<null>(state)
}
{
  const [state] = useQueryState('boolean', {
    ...queryTypes.isoDateTime,
    defaultValue: new Date()
  })
  expectType<Date>(state)
  expectNotAssignable<null>(state)
}

// Custom serializers --
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
  const [, set] = useQueryState('foo', queryTypes.integer)
  set(null)
  set(old => {
    expectType<number | null>(old)
    return null
  })
}
{
  const [, set] = useQueryState('foo', queryTypes.float.withDefault(0.2))
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

// Expect errors on misuse
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
