import { afterEach, describe, expect, it, vi } from 'vitest'
import { debug, warn } from '../debug'
import { clearEvents, getEvents } from './buffer'
import { eventClient } from './events'
import { installNuqsDevtoolsSink } from './sink'

// Mock the bus emit so installing the sink doesn't kick off the EventClient's
// connect/retry loop (no devtools shell is present in unit tests).
function withSink() {
  const emit = vi.spyOn(eventClient, 'emit').mockImplementation(() => {})
  const remove = installNuqsDevtoolsSink()
  return { emit, remove }
}

describe('devtools/sink', () => {
  afterEach(() => {
    clearEvents()
    vi.restoreAllMocks()
  })

  it('records a normalized, immutable event and emits it on the bus', () => {
    const { emit, remove } = withSink()
    const url = new URL('https://example.com/?a=1')
    debug(20, 'react', url)

    const events = getEvents()
    expect(events).toHaveLength(1)
    const event = events[0]!
    expect(event.code).toBe(20)
    expect(event.category).toBe('adapter')
    expect(event.level).toBe('log')
    expect(event.message).toContain('Updating url')
    expect(event.args[0]).toBe('react')
    expect(event.args[1]).toBeInstanceOf(URL)
    expect(event.args[1]).not.toBe(url) // a cloned snapshot, not the live ref
    expect(emit).toHaveBeenCalledWith('log', event)
    remove()
  })

  it('replaces functions in logged options with a presence marker', () => {
    const { remove } = withSink()
    debug(7, 'q', 'value', {
      startTransition: () => {},
      history: 'push'
    })
    expect(getEvents().at(-1)!.args[2]).toEqual({
      startTransition: '[Function]',
      history: 'push'
    })
    remove()
  })

  it('flags warnings with the warn level', () => {
    const { remove } = withSink()
    warn(24, 'value', new Error('boom'))
    expect(getEvents().at(-1)!.level).toBe('warn')
    remove()
  })

  it('never throws when an arg resists JSON formatting (cycle / BigInt)', () => {
    const { remove } = withSink()
    const cyclic: Record<string, unknown> = {}
    cyclic.self = cyclic
    expect(() => debug(6, 'id', 'key', cyclic)).not.toThrow()
    expect(() => debug(6, 'id', 'key', { big: 1n })).not.toThrow()
    // The event is kept, falling back to the raw template rather than dropped.
    expect(getEvents().at(-1)!.message).toContain('setState')
    remove()
  })
})
