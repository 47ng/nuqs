import { describe, expectTypeOf, it } from 'vitest'
import { parseAsInteger, parseAsString, useQueryStates } from '../../dist'

describe('types/useQueryStates', () => {
  const parsers = {
    a: parseAsString,
    b: parseAsInteger
  }
  it('has nullable state by default', () => {
    const [state, setState] = useQueryStates(parsers)
    expectTypeOf(state).toEqualTypeOf<{ a: string | null; b: number | null }>()
    setState({ a: 'foo', b: 42 })
    setState(old => {
      expectTypeOf(old).toEqualTypeOf<{ a: string | null; b: number | null }>()
      return { a: 'bar' }
    })
  })
  it('allows partial updates', () => {
    const [, setState] = useQueryStates(parsers)
    setState({ a: 'foo' })
    setState(() => ({ b: 42 }))
  })
  it('allows setting null to clear the query', () => {
    const [, setState] = useQueryStates(parsers)
    setState({ a: null }) // Clear an individual key
    setState(null) // Clear all managed keys
    setState(() => ({ a: null }))
    // setState(() => null) // todo: Enable this test in a separate PR
  })
  it('allows setting to undefined to leave keys as-is', () => {
    const [, setState] = useQueryStates(parsers)
    setState({ a: undefined }) // No change
    setState(() => ({ a: undefined })) // No change
  })
  it("doesn't allow setting undefined globally", () => {
    const [, setState] = useQueryStates(parsers)
    // @ts-expect-error
    setState(undefined)
    // @ts-expect-error
    setState(() => undefined)
  })
  it('makes state non-nullable when using default values', () => {
    const [state, setState] = useQueryStates({
      a: parseAsString.withDefault('foo'),
      b: parseAsInteger.withDefault(42)
    })
    expectTypeOf(state).toEqualTypeOf<{ a: string; b: number }>()
    setState({ a: 'bar', b: 42 })
    setState({ a: null, b: null }) // Still allowed to clear it with null (state retuns to default)
    setState(null)
    setState(old => {
      expectTypeOf(old).toEqualTypeOf<{ a: string; b: number }>()
      return {}
    })
    setState(() => ({ a: null, b: null })) // Still allowed to clear it with null (state retuns to default)
    // setState(() => null)  // todo: Enable this test in a separate PR
  })
  it('supports inline custom parsers', () => {
    const [state] = useQueryStates({
      a: {
        parse: parseInt,
        serialize: value => value.toString()
      },
      b: {
        parse: input => Uint8Array.from(input),
        eq: (a: Uint8Array, b: Uint8Array) =>
          a === b || (a.length === b.length && a.every((v, i) => v === b[i])),
        defaultValue: Uint8Array.from('')
      }
    })
    expectTypeOf(state).toEqualTypeOf<{
      a: number | null
      b: Uint8Array<ArrayBuffer>
    }>()
  })
  it('supports urlKeys', () => {
    const [state, setState] = useQueryStates(parsers, {
      urlKeys: {
        a: 'u',
        b: 'v'
      }
    })
    // State uses the original key names
    expectTypeOf(state).toEqualTypeOf<{
      a: string | null
      b: number | null
    }>()
    setState({ a: 'baz', b: 42 })
    useQueryStates(parsers, {
      urlKeys: {
        // @ts-expect-error
        notInTheList: 'should-error'
      }
    })
  })
})
