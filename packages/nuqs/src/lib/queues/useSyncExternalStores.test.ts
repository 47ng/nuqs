import { act, renderHook } from '@testing-library/react'
import { useRef } from 'react'
import { describe, expect, it } from 'vitest'
import { createEmitter } from '../emitter'
import { useSyncExternalStores } from './useSyncExternalStores'

describe('useSyncExternalStores', () => {
  it('should handle an empty array of keys', () => {
    const useTest = () =>
      useSyncExternalStores(
        [],
        (_, callback) => callback,
        _ => 'snapshot'
      )
    const { result } = renderHook(useTest)
    expect(result.current).toEqual({})
  })
  it('should handle a single key', () => {
    const useTest = () =>
      useSyncExternalStores(
        ['a'],
        (_, callback) => callback,
        _ => 'snapshot'
      )
    const { result } = renderHook(useTest)
    expect(result.current).toEqual({ a: 'snapshot' })
  })
  it('should be reactive to changes in the store', () => {
    const emitter = createEmitter()
    const store: Record<string, number> = {
      a: 0
    }
    const useTest = () =>
      useSyncExternalStores(
        ['a'],
        (key, callback) => {
          emitter.on(key, callback)
          return () => emitter.off(key, callback)
        },
        key => store[key]
      )
    const { result } = renderHook(useTest)
    expect(result.current).toEqual({ a: 0 })
    // Update the store
    act(() => {
      store.a = 1
      emitter.emit('a')
    })
    expect(result.current).toEqual({ a: 1 })
  })
  it('should be reactive to changes in the keys', () => {
    const emitter = createEmitter()
    const store: Record<string, number> = {
      a: 0,
      b: 0
    }
    const useTest = ({ keys = ['a'] }: { keys?: string[] } = {}) =>
      useSyncExternalStores(
        keys,
        (key, callback) => {
          emitter.on(key, callback)
          return () => emitter.off(key, callback)
        },
        key => store[key]
      )
    const { result, rerender } = renderHook(useTest)
    expect(result.current).toEqual({ a: 0 })
    rerender({ keys: ['b'] })
    expect(result.current).toEqual({ b: 0 })
  })
  it('should not re-render when a non-listened key changes', () => {
    const emitter = createEmitter()
    const store: Record<string, number> = {
      a: 0,
      b: 0
    }
    const useTest = () => {
      const renderCount = useRef(0)
      const result = useSyncExternalStores(
        ['a'],
        (key, callback) => {
          emitter.on(key, callback)
          return () => emitter.off(key, callback)
        },
        key => store[key]
      )
      return {
        renderCount: ++renderCount.current,
        result
      }
    }
    const { result } = renderHook(useTest)
    expect(result.current.result).toEqual({ a: 0 })
    expect(result.current.renderCount).toBe(1)
    // Update another key
    act(() => {
      store.b = 1
      emitter.emit('b')
    })
    expect(result.current.result).toEqual({ a: 0 })
    expect(result.current.renderCount).toBe(1)
    // Update the listened key
    act(() => {
      store.a = 1
      emitter.emit('a')
    })
    expect(result.current.result).toEqual({ a: 1 })
    expect(result.current.renderCount).toBe(2)
  })
})
