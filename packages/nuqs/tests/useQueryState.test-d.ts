import { describe, expectTypeOf, it } from 'vitest'
import {
  debounce,
  defaultRateLimit,
  parseAsString,
  throttle,
  useQueryState,
  parseAsStringLiteral
} from '../dist'

describe('types/useQueryState', () => {
  it('has a nullable string state by default', () => {
    const [state, setState] = useQueryState('foo')
    expectTypeOf(state).toEqualTypeOf<string | null>()
    setState('bar')
    setState(old => old?.toUpperCase() ?? null)
    expectTypeOf(setState('bar')).toEqualTypeOf<Promise<URLSearchParams>>()
  })
  it('accepts options as a second argument', () => {
    const [state, setState] = useQueryState('foo', {
      history: 'push',
      scroll: false,
      shallow: true,
      throttleMs: 100,
      clearOnDefault: true
    })
    expectTypeOf(state).toEqualTypeOf<string | null>()
    setState('bar')
    setState(old => old?.toUpperCase() ?? null)
    expectTypeOf(setState('bar')).toEqualTypeOf<Promise<URLSearchParams>>()
  })
  it('accepts a default value as second argument, making the state non-nullable', () => {
    const [state] = useQueryState('foo', { defaultValue: 'bar' })
    expectTypeOf(state).toEqualTypeOf<string>()
  })
  it('accepts parsers as a second argument', () => {
    const [nullable] = useQueryState('foo', parseAsString)
    const [nonNullable] = useQueryState('foo', parseAsString.withDefault('bar'))
    expectTypeOf(nullable).toEqualTypeOf<string | null>()
    expectTypeOf(nonNullable).toEqualTypeOf<string>()
  })
  it('accepts spreading in the default value', () => {
    const [state] = useQueryState('foo', {
      ...parseAsString,
      defaultValue: 'bar'
    })
    expectTypeOf(state).toEqualTypeOf<string>()
  })
  it('accepts passing in a parse function', () => {
    const [state] = useQueryState('foo', {
      parse(query) {
        expectTypeOf(query).toEqualTypeOf<string>()
        return 42
      }
    })
    expectTypeOf(state).toEqualTypeOf<number | null>()
  })
  it('accepts passing in a serialize function', () => {
    const [state] = useQueryState('foo', {
      parse: parseInt,
      serialize(value) {
        expectTypeOf(value).toEqualTypeOf<number>()
        return '42'
      }
    })
    expectTypeOf(state).toEqualTypeOf<number | null>()
  })
  it('accepts passing in an equality function', () => {
    const [state] = useQueryState('foo', {
      parse: parseInt,
      eq(a, b) {
        expectTypeOf(a).toEqualTypeOf<number>()
        expectTypeOf(b).toEqualTypeOf<number>()
        return a === b
      }
    })
    expectTypeOf(state).toEqualTypeOf<number | null>()
  })
  it('allows setting null to clear the query', () => {
    const [, set] = useQueryState('foo')
    set(null)
    set(old => {
      expectTypeOf(old).toEqualTypeOf<string | null>()
      return null
    })
  })
  it('allows setting null to clear the query (with default value)', () => {
    const [, set] = useQueryState('foo', { defaultValue: 'bar' })
    set(null)
    set(old => {
      expectTypeOf(old).toEqualTypeOf<string>()
      return null
    })
  })
  it('strongly binds parse & serialize', () => {
    useQueryState('foo', {
      parse: (str: string) => str.length,
      // @ts-expect-error
      serialize: value => value.toUpperCase() // value is number
    })
  })
  it('strongly binds parse & eq', () => {
    useQueryState('foo', {
      parse: parseInt,
      // @ts-expect-error
      eq: (a: number, b: number) => a.toUpperCase() === b.toUpperCase()
    })
  })
  it("accepts a type parameter, but overloads require passing a parser if it's not a string", () => {
    // @ts-expect-error - missing parser
    useQueryState<number>('foo')
    // @ts-expect-error - mismatched types
    useQueryState<number>('foo', parseAsString)
  })
  it("doesn't allow passing undefined as value", () => {
    const [, setFoo] = useQueryState('foo')
    const [, setBar] = useQueryState('bar', parseAsString.withDefault('egg'))
    // @ts-expect-error
    setFoo(undefined)
    // @ts-expect-error
    setFoo(() => undefined)
    // @ts-expect-error
    setBar(undefined)
    // @ts-expect-error
    setBar(() => undefined)
  })
  it('accepts a limitUrlUpdates option', () => {
    useQueryState('foo', {
      limitUrlUpdates: {
        method: 'throttle',
        timeMs: 100
      }
    })
    useQueryState('foo', {
      limitUrlUpdates: {
        method: 'debounce',
        timeMs: 100
      }
    })
    useQueryState('foo', { limitUrlUpdates: throttle(100) })
    useQueryState('foo', { limitUrlUpdates: debounce(100) })
    useQueryState('foo', { limitUrlUpdates: defaultRateLimit })
    // Using parsers options (builder pattern)
    parseAsString.withOptions({
      limitUrlUpdates: {
        method: 'throttle',
        timeMs: 100
      }
    })
    parseAsString.withOptions({
      limitUrlUpdates: {
        method: 'debounce',
        timeMs: 100
      }
    })
    parseAsString.withOptions({ limitUrlUpdates: throttle(100) })
    parseAsString.withOptions({ limitUrlUpdates: debounce(100) })
    parseAsString.withOptions({ limitUrlUpdates: defaultRateLimit })
    // State updater function
    const [, setState] = useQueryState('foo')
    setState(null, {
      limitUrlUpdates: {
        method: 'throttle',
        timeMs: 100
      }
    })
    setState(null, {
      limitUrlUpdates: {
        method: 'debounce',
        timeMs: 100
      }
    })
    setState(null, { limitUrlUpdates: throttle(100) })
    setState(null, { limitUrlUpdates: debounce(100) })
    setState(null, { limitUrlUpdates: defaultRateLimit })
  })
  it('accepts defaultValue depending on parser when used with object syntax', () => {
    const issueTypes = ['open', 'closed'] as const
    const [issueType] = useQueryState(
      'issueType',
      {
        ...parseAsStringLiteral(issueTypes),
        defaultValue: 'open'
      }
    );

    expectTypeOf(issueType).toEqualTypeOf<'open' | 'closed'>()

    useQueryState(
      'issueType',
      {
        ...parseAsStringLiteral(issueTypes),
        // @ts-expect-error - defaultValue must be one of the issueTypes
        defaultValue: 'thisiswrong'
      }
    );

    // let's check if order matters (it shouldn't)
    useQueryState(
      'issueType',
      {
        // @ts-expect-error - defaultValue must be one of the issueTypes
        defaultValue: 'thisiswrong',
        ...parseAsStringLiteral(issueTypes)
      }
    );
  })
})
