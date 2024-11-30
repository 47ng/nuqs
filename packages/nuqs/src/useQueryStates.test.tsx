import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import React from 'react'
import { describe, expect, it } from 'vitest'
import { NuqsTestingAdapter } from './adapters/testing'
import { parseAsArrayOf, parseAsJson, parseAsString } from './parsers'
import { useQueryStates } from './useQueryStates'

function withSearchParams(
  searchParams?: string | URLSearchParams | Record<string, string>
) {
  return (props: { children: ReactNode }) => (
    <NuqsTestingAdapter searchParams={searchParams} {...props} />
  )
}

const defaults = {
  str: 'foo',
  obj: { initial: 'state' },
  arr: [
    {
      initial: 'state'
    }
  ]
}

const hook = ({ defaultValue } = { defaultValue: defaults.str }) => {
  return useQueryStates({
    str: parseAsString.withDefault(defaultValue),
    obj: parseAsJson<any>(x => x).withDefault(defaults.obj),
    arr: parseAsArrayOf(parseAsJson<any>(x => x)).withDefault(defaults.arr)
  })
}

describe('useQueryStates', () => {
  it('should have referential equality on default values', () => {
    const { result } = renderHook(hook, {
      wrapper: NuqsTestingAdapter
    })
    const [state] = result.current
    expect(state.str).toBe(defaults.str)
    expect(state.obj).toBe(defaults.obj)
    expect(state.arr).toBe(defaults.arr)
    expect(state.arr[0]).toBe(defaults.arr[0])
  })

  it('should keep referential equality when resetting to defaults', () => {
    const { result } = renderHook(hook, {
      wrapper: withSearchParams({
        str: 'foo',
        obj: '{"hello":"world"}',
        arr: '{"obj":true},{"arr":true}'
      })
    })
    act(() => {
      result.current[1](null)
    })
    const [state] = result.current
    expect(state.str).toBe(defaults.str)
    expect(state.obj).toBe(defaults.obj)
    expect(state.arr).toBe(defaults.arr)
    expect(state.arr[0]).toBe(defaults.arr[0])
  })

  it('should keep referential equality when unrelated keys change', () => {
    const { result } = renderHook(hook, {
      wrapper: withSearchParams({
        str: 'foo',
        obj: '{"hello":"world"}'
        // Keep arr as default
      })
    })
    const [{ obj: initialObj, arr: initialArr }] = result.current
    act(() => {
      result.current[1]({ str: 'bar' })
    })
    const [{ str, obj, arr }] = result.current
    expect(str).toBe('bar')
    expect(obj).toBe(initialObj)
    expect(arr).toBe(initialArr)
  })

  it('should keep referential equality when default changes for another key', () => {
    const { result, rerender } = renderHook(hook, {
      wrapper: withSearchParams()
    })
    expect(result.current[0].str).toBe('foo')
    rerender({ defaultValue: 'b' })
    const [state] = result.current
    expect(state.str).toBe('b')
    expect(state.obj).toBe(defaults.obj)
    expect(state.arr).toBe(defaults.arr)
    expect(state.arr[0]).toBe(defaults.arr[0])
  })
})
