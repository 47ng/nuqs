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
  it('allows listing all handlers for an event', () => {
    const emitter = createEmitter<Events>()
    const handler1 = vi.fn()
    const handler2 = vi.fn()
    emitter.on('test', handler1)
    emitter.on('test', handler2)
    expect(emitter.all.get('test')).toEqual([handler1, handler2])
    emitter.off('test', handler1)
    expect(emitter.all.get('test')).toEqual([handler2])
  })
  it('allows emitting events with no payload', () => {
    const emitter = createEmitter<{ test: never }>()
    const handler = vi.fn()
    emitter.on('test', handler)
    emitter.emit('test')
    expect(handler).toHaveBeenCalledExactlyOnceWith(undefined)
  })
})
