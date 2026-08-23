import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { createEmitter } from '../../lib/emitter'
import {
  hasPendingPush,
  historyUpdateMarker,
  markPendingPush,
  patchHistory,
  type SearchParamsSyncEmitterEvents,
  updatePendingPushUrl
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

function optimisticPush(search: string) {
  const url = new URL(search, location.href)
  history.pushState(markPendingPush(url), historyUpdateMarker, url)
  pushState.mockClear()
}

function traverse(action: () => void): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      window.removeEventListener('popstate', onPop)
      reject(new Error('popstate did not fire within 2s'))
    }, 2000)
    function onPop() {
      clearTimeout(timeout)
      resolve()
    }
    window.addEventListener('popstate', onPop, { once: true })
    action()
  })
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
    optimisticPush('?a=1')
    routerPush('?a=1')
    expect(replaceState).toHaveBeenCalledExactlyOnceWith({ idx: 1 }, '', '?a=1')
    expect(pushState).not.toHaveBeenCalled()
    expect(onUpdate).toHaveBeenCalledExactlyOnceWith(
      new URLSearchParams('?a=1')
    )
    expect(hasPendingPush()).toBe(false)
  })

  it('replaces the pending entry with a redirected commit', () => {
    optimisticPush('?a=1')
    routerPush('?redirected=true')
    expect(replaceState).toHaveBeenCalledExactlyOnceWith(
      { idx: 1 },
      '',
      '?redirected=true'
    )
    expect(pushState).not.toHaveBeenCalled()
  })

  it('does not fold a router commit over a state-less entry', () => {
    optimisticPush('?a=1')
    history.pushState(null, historyUpdateMarker, '#anchor')
    pushState.mockClear()

    routerPush('?a=1')

    expect(pushState).toHaveBeenCalledExactlyOnceWith({ idx: 1 }, '', '?a=1')
    expect(replaceState).not.toHaveBeenCalled()
    expect(hasPendingPush()).toBe(false)
  })

  it('pushes a same-URL router commit after a pop left the pending entry', () => {
    markPendingPush(new URL('?a=1', location.href))
    window.dispatchEvent(new PopStateEvent('popstate'))
    routerPush('?a=1')
    expect(pushState).toHaveBeenCalledExactlyOnceWith({ idx: 1 }, '', '?a=1')
    expect(replaceState).not.toHaveBeenCalled()
  })

  it('pushes an unrelated commit after a pop left the pending entry', () => {
    markPendingPush(new URL('?a=1', location.href))
    window.dispatchEvent(new PopStateEvent('popstate'))
    routerPush('?b=1')
    expect(pushState).toHaveBeenCalledExactlyOnceWith({ idx: 1 }, '', '?b=1')
    expect(replaceState).not.toHaveBeenCalled()
    expect(hasPendingPush()).toBe(false)
  })

  it('stops reporting a pending push after a pop left its entry', () => {
    markPendingPush(new URL('?a=1', location.href))
    window.dispatchEvent(new PopStateEvent('popstate'))
    expect(hasPendingPush()).toBe(false)
  })

  it('repairs the index of the pending entry traversed forward onto', async () => {
    history.replaceState({ idx: 4 }, historyUpdateMarker, '?')
    const pendingUrl = new URL('?a=1', location.href)
    history.pushState(
      markPendingPush(pendingUrl),
      historyUpdateMarker,
      pendingUrl
    )
    await traverse(() => history.back())
    await traverse(() => history.forward())
    expect(history.state).toEqual({ idx: 5 })
    expect(hasPendingPush()).toBe(false)
  })

  it('does not repair an older entry with the pending URL and index', async () => {
    history.replaceState({ idx: 4 }, historyUpdateMarker, '?a=1')
    history.pushState({ idx: 4 }, historyUpdateMarker, '?a=2')
    const pendingUrl = new URL('?a=1', location.href)
    history.pushState(
      markPendingPush(pendingUrl),
      historyUpdateMarker,
      pendingUrl
    )
    await traverse(() => history.back())
    await traverse(() => history.back())
    expect(history.state).toEqual({ idx: 4 })
    expect(hasPendingPush()).toBe(false)
  })

  it('keeps the pending push across marked nuqs updates', () => {
    markPendingPush(new URL('?a=1', location.href))
    history.pushState(null, historyUpdateMarker, '?a=1')
    history.replaceState(null, historyUpdateMarker, '?a=2')
    expect(hasPendingPush()).toBe(true)
  })

  it('repairs a pending push committed by a router replace', () => {
    history.replaceState({ idx: 3 }, historyUpdateMarker, '?')
    const pendingUrl = new URL('?a=1', location.href)
    history.pushState(
      markPendingPush(pendingUrl),
      historyUpdateMarker,
      pendingUrl
    )
    replaceState.mockClear()
    history.replaceState({ usr: null, key: 'router', idx: 3 }, '', '?b=1')
    expect(replaceState).toHaveBeenCalledExactlyOnceWith(
      { usr: null, key: 'router', idx: 4 },
      '',
      '?b=1'
    )
    expect(history.state).toEqual({ usr: null, key: 'router', idx: 4 })
    expect(hasPendingPush()).toBe(false)
  })

  it('keeps a shallow replacement when the router commits the pending push', () => {
    history.replaceState({ idx: 0 }, historyUpdateMarker, '?a=1')
    optimisticPush('?a=1')
    updatePendingPushUrl(new URL('?a=1&shallow=pass', location.href))
    history.replaceState(
      history.state,
      historyUpdateMarker,
      '?a=1&shallow=pass'
    )
    replaceState.mockClear()
    routerPush('?a=1')
    expect(replaceState).toHaveBeenCalledExactlyOnceWith(
      { idx: 1 },
      '',
      new URL('?a=1&shallow=pass', location.href)
    )
    expect(pushState).not.toHaveBeenCalled()
  })

  it('does not retarget a pending push from a shallow replace after Back', async () => {
    history.replaceState({ idx: 0 }, historyUpdateMarker, '?a=1')
    optimisticPush('?a=1')
    await traverse(() => history.back())
    updatePendingPushUrl(new URL('?a=1&shallow=pass', location.href))
    history.replaceState(
      history.state,
      historyUpdateMarker,
      '?a=1&shallow=pass'
    )
    await traverse(() => history.forward())
    expect(history.state).toEqual({ idx: 1 })
    expect(hasPendingPush()).toBe(false)
  })

  it('clears the pending push on a router replace', () => {
    markPendingPush(new URL('?a=1', location.href))
    routerReplace('?a=1')
    expect(hasPendingPush()).toBe(false)
  })
})
