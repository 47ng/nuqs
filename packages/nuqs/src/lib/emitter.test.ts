import { describe, expect, it, vi } from 'vitest'
import { createEmitter } from './emitter'

type Events = {
  test: string
}

describe('emitter', () => {
  it('allows subscribing to events', () => {
    const emitter = createEmitter<Events>()
    const handler = vi.fn()
    emitter.on('test', handler)
    emitter.emit('test', 'pass')
    expect(handler).toHaveBeenCalledExactlyOnceWith('pass')
  })
  it('allows unsubscribing from events from the returned callback', () => {
    const emitter = createEmitter<Events>()
    const handler = vi.fn()
    const unsubscribe = emitter.on('test', handler)
    unsubscribe()
    emitter.emit('test', 'pass')
    expect(handler).not.toHaveBeenCalled()
  })
  it('allows unsubscribing from events from an off method', () => {
    const emitter = createEmitter<Events>()
    const handler = vi.fn()
    emitter.on('test', handler)
    emitter.off('test', handler)
    emitter.emit('test', 'pass')
    expect(handler).not.toHaveBeenCalled()
  })
  it('ignores removing a handler from an event with no subscribers', () => {
    const emitter = createEmitter<Events>()
    const handler = vi.fn()
    emitter.off('test', handler)
    emitter.emit('test', 'pass')
    expect(handler).not.toHaveBeenCalled()
  })
  it('removes only the requested handler', () => {
    const emitter = createEmitter<Events>()
    const removed = vi.fn()
    const kept = vi.fn()
    emitter.on('test', removed)
    emitter.on('test', kept)
    emitter.off('test', removed)
    emitter.emit('test', 'pass')
    expect(removed).not.toHaveBeenCalled()
    expect(kept).toHaveBeenCalledExactlyOnceWith('pass')
  })
  it('allows emitting events with no payload', () => {
    const emitter = createEmitter<{ test: never }>()
    const handler = vi.fn()
    emitter.on('test', handler)
    emitter.emit('test')
    expect(handler).toHaveBeenCalledExactlyOnceWith(undefined)
  })
})
