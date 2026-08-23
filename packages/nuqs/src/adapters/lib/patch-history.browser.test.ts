import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { createEmitter } from '../../lib/emitter'
import {
  hasPendingPush,
  historyUpdateMarker,
  markPendingPush,
  patchHistory,
  type SearchParamsSyncEmitterEvents
} from './patch-history'

const pushState = vi.spyOn(history, 'pushState')
const replaceState = vi.spyOn(history, 'replaceState')
const emitter = createEmitter<SearchParamsSyncEmitterEvents>()
const onUpdate = vi.fn()
emitter.on('update', onUpdate)

function routerPush(search: string) {
  history.pushState({ idx: 1 }, '', search)
}

function routerReplace(search: string) {
  history.replaceState({ idx: 1 }, '', search)
}

describe('patchHistory: pending push', () => {
  beforeAll(() => {
    patchHistory(emitter, 'test')
  })
  beforeEach(() => {
    routerReplace('?')
    expect(hasPendingPush()).toBe(false)
    pushState.mockClear()
    replaceState.mockClear()
    onUpdate.mockClear()
  })

  it('lets a router push add an entry when nothing is pending', () => {
    routerPush('?a=1')
    expect(pushState).toHaveBeenCalledExactlyOnceWith({ idx: 1 }, '', '?a=1')
    expect(replaceState).not.toHaveBeenCalled()
  })

  it('turns the router commit of a pending push into a replace', () => {
    markPendingPush(new URL('?a=1', location.href))
    routerPush('?a=1')
    expect(replaceState).toHaveBeenCalledExactlyOnceWith({ idx: 1 }, '', '?a=1')
    expect(pushState).not.toHaveBeenCalled()
    expect(onUpdate).toHaveBeenCalledExactlyOnceWith(
      new URLSearchParams('?a=1')
    )
    expect(hasPendingPush()).toBe(false)
  })

  it('replaces the pending entry with a redirected commit', () => {
    markPendingPush(new URL('?a=1', location.href))
    routerPush('?redirected=true')
    expect(replaceState).toHaveBeenCalledExactlyOnceWith(
      { idx: 1 },
      '',
      '?redirected=true'
    )
    expect(pushState).not.toHaveBeenCalled()
  })

  it('still folds the commit after a pop restored the pending entry', () => {
    markPendingPush(new URL('?a=1', location.href))
    window.dispatchEvent(new PopStateEvent('popstate'))
    window.dispatchEvent(new PopStateEvent('popstate'))
    routerPush('?a=1')
    expect(replaceState).toHaveBeenCalledExactlyOnceWith({ idx: 1 }, '', '?a=1')
    expect(pushState).not.toHaveBeenCalled()
  })

  it('pushes an unrelated commit after a pop left the pending entry', () => {
    markPendingPush(new URL('?a=1', location.href))
    window.dispatchEvent(new PopStateEvent('popstate'))
    routerPush('?b=1')
    expect(pushState).toHaveBeenCalledExactlyOnceWith({ idx: 1 }, '', '?b=1')
    expect(replaceState).not.toHaveBeenCalled()
    expect(hasPendingPush()).toBe(false)
  })

  it('repairs the index of a pending entry traversed back onto', () => {
    history.replaceState({ idx: 4 }, '', '?')
    history.pushState({ idx: 4 }, historyUpdateMarker, '?a=1')
    markPendingPush(new URL('?a=1', location.href))
    window.dispatchEvent(new PopStateEvent('popstate'))
    expect(history.state).toEqual({ idx: 5 })
    expect(hasPendingPush()).toBe(false)
    history.back()
  })

  it('keeps the pending push across marked nuqs updates', () => {
    markPendingPush(new URL('?a=1', location.href))
    history.pushState(null, historyUpdateMarker, '?a=1')
    history.replaceState(null, historyUpdateMarker, '?a=2')
    expect(hasPendingPush()).toBe(true)
  })

  it('clears the pending push on a router replace', () => {
    markPendingPush(new URL('?a=1', location.href))
    routerReplace('?a=1')
    expect(hasPendingPush()).toBe(false)
  })
})
