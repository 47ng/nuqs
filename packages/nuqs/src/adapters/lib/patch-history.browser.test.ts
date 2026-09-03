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

const indexSeenOnPop = vi.fn<(idx: number | undefined) => void>()

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
    window.addEventListener('popstate', () =>
      indexSeenOnPop(history.state?.idx)
    )
  })
  beforeEach(() => {
    routerReplace('?')
    routerPush('?')
    expect(hasPendingPush()).toBe(false)
    pushState.mockClear()
    replaceState.mockClear()
    onUpdate.mockClear()
    indexSeenOnPop.mockClear()
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

  it('repairs the pending index before later popstate listeners read it', async () => {
    history.replaceState({ idx: 4 }, historyUpdateMarker, '?')
    optimisticPush('?a=1')
    await traverse(() => history.back())
    await traverse(() => history.forward())
    expect(indexSeenOnPop).toHaveBeenNthCalledWith(1, 4)
    expect(indexSeenOnPop).toHaveBeenNthCalledWith(2, 5)
  })

  it('repairs the pending entry after a replace on its predecessor', async () => {
    history.replaceState({ idx: 4 }, historyUpdateMarker, '?')
    optimisticPush('?a=1')
    await traverse(() => history.back())
    history.replaceState({ idx: 4, usr: 'unrelated' }, '', '?')
    await traverse(() => history.forward())
    expect(history.state).toEqual({ idx: 5 })
    expect(hasPendingPush()).toBe(false)
  })

  it('repairs the pending entry after a marked replace changed its URL', async () => {
    history.replaceState({ idx: 4 }, historyUpdateMarker, '?')
    optimisticPush('?a=1')
    history.replaceState(history.state, historyUpdateMarker, '?a=1&b=2')
    await traverse(() => history.back())
    await traverse(() => history.forward())
    expect(history.state).toEqual({ idx: 5 })
    expect(hasPendingPush()).toBe(false)
  })

  it('leaves the router one index behind on the first Back after a replace commit', async () => {
    history.replaceState({ idx: 4 }, historyUpdateMarker, '?')
    optimisticPush('?a=1')
    const indexReadByTheRouter = history.state.idx
    history.replaceState({ idx: indexReadByTheRouter }, '', '?a=1')
    expect(history.state).toEqual({ idx: 5 })
    await traverse(() => history.back())
    expect(history.state).toEqual({ idx: 4 })
    expect(history.state.idx - indexReadByTheRouter).toBe(0)
    await traverse(() => history.forward())
    expect(history.state).toEqual({ idx: 5 })
  })

  it('repairs the pending entry when a marked update copied its marker', async () => {
    history.replaceState({ idx: 4 }, historyUpdateMarker, '?')
    optimisticPush('?a=1')
    history.pushState(history.state, historyUpdateMarker, '?a=1&shallow=1')
    history.replaceState(history.state, historyUpdateMarker, '?a=1&shallow=2')
    await traverse(() => history.back())
    expect(history.state).toEqual({ idx: 5 })
    expect(hasPendingPush()).toBe(false)
  })

  it('does not repair an entry that only shares the pending marker', async () => {
    history.replaceState({ idx: 4 }, historyUpdateMarker, '?')
    optimisticPush('?a=1')
    history.pushState(history.state, historyUpdateMarker, '?a=1&shallow=1')
    history.pushState(history.state, historyUpdateMarker, '?a=1&shallow=2')
    await traverse(() => history.back())
    expect(history.state.idx).toBe(4)
    expect(history.state[historyUpdateMarker]).toBeDefined()
  })

  it('clears a pending push when a replace lands elsewhere without a pop', () => {
    optimisticPush('?a=1')
    history.pushState(null, historyUpdateMarker, '#anchor')
    routerReplace('#anchor')
    expect(hasPendingPush()).toBe(false)
  })

  it('syncs a router replace that is not a pending push commit', async () => {
    history.replaceState({ idx: 4 }, historyUpdateMarker, '?')
    optimisticPush('?a=1')
    await traverse(() => history.back())
    onUpdate.mockClear()
    history.replaceState({ idx: 4 }, '', '?other=1')
    expect(onUpdate).toHaveBeenCalledExactlyOnceWith(
      new URLSearchParams('?other=1')
    )
  })

  it('leaves a router replace that does not carry the cloned index alone', () => {
    history.replaceState({ idx: 3 }, historyUpdateMarker, '?')
    optimisticPush('?a=1')
    history.replaceState({ idx: 9, key: 'router' }, '', '?b=1')
    expect(history.state).toEqual({ idx: 9, key: 'router' })
  })

  it('leaves a router replace alone on an entry with no cloned index', () => {
    history.replaceState(undefined, historyUpdateMarker, '?')
    optimisticPush('?a=1')
    history.replaceState({ key: 'router' }, '', '?a=1')
    expect(history.state).toEqual({ key: 'router' })
  })

  it('pushes a router commit onto an abandoned entry with no cloned index', async () => {
    history.replaceState(undefined, historyUpdateMarker, '?')
    optimisticPush('?a=1')
    await traverse(() => history.back())
    await traverse(() => history.forward())
    expect(history.state).toEqual({ [historyUpdateMarker]: expect.any(Number) })
    expect(hasPendingPush()).toBe(false)
    pushState.mockClear()
    replaceState.mockClear()
    routerPush('?a=1')
    expect(pushState).toHaveBeenCalledExactlyOnceWith({ idx: 1 }, '', '?a=1')
    expect(replaceState).not.toHaveBeenCalled()
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
    optimisticPush('?a=1')
    history.replaceState(history.state, historyUpdateMarker, '?a=2')
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
})
