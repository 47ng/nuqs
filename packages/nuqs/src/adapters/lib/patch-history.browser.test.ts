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

function routerPush(search: string) {
  history.pushState({ idx: 1 }, '', search)
}

function routerReplace(search: string) {
  history.replaceState({ idx: 1 }, '', search)
}

describe('patchHistory: pending push', () => {
  beforeAll(() => {
    patchHistory(createEmitter<SearchParamsSyncEmitterEvents>(), 'test')
  })
  beforeEach(() => {
    routerReplace('?')
    pushState.mockClear()
    replaceState.mockClear()
  })

  it('lets a router push add an entry when nothing is pending', () => {
    routerPush('?a=1')
    expect(pushState).toHaveBeenCalledExactlyOnceWith({ idx: 1 }, '', '?a=1')
    expect(replaceState).not.toHaveBeenCalled()
  })

  it('turns the router commit of a pending push into a replace', () => {
    markPendingPush()
    routerPush('?a=1')
    expect(replaceState).toHaveBeenCalledExactlyOnceWith({ idx: 1 }, '', '?a=1')
    expect(pushState).not.toHaveBeenCalled()
    expect(hasPendingPush()).toBe(false)
  })

  it('keeps the pending push across marked nuqs updates', () => {
    markPendingPush()
    history.pushState(null, historyUpdateMarker, '?a=1')
    history.replaceState(null, historyUpdateMarker, '?a=2')
    expect(hasPendingPush()).toBe(true)
  })

  it('clears the pending push on a router replace', () => {
    markPendingPush()
    routerReplace('?a=1')
    expect(hasPendingPush()).toBe(false)
  })

  it('clears the pending push on popstate', () => {
    markPendingPush()
    window.dispatchEvent(new PopStateEvent('popstate'))
    expect(hasPendingPush()).toBe(false)
  })
})
