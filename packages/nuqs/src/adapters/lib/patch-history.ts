import { debug } from '../../lib/debug'
import { createEmitter, type Emitter } from '../../lib/emitter'
import { error } from '../../lib/errors'
import { globalSingleton } from '../../lib/global-singleton'
import { resetQueues, spinQueueResetMutex } from '../../lib/queues/reset'
import { getSearchParams } from '../../lib/search-params'
import { version } from '../../lib/version'

export type SearchParamsSyncEmitterEvents = { update: URLSearchParams }

export function getHistorySyncEmitter(
  adapter: string
): Emitter<SearchParamsSyncEmitterEvents> {
  return globalSingleton(`history-emitter.${adapter}`, () =>
    createEmitter<SearchParamsSyncEmitterEvents>()
  )
}

export const historyUpdateMarker = '__nuqs__'

type PendingPushState = {
  [historyUpdateMarker]: number
}

type PendingNavigationBase = {
  href: string
  currentHref: string
  routerIndex: number | undefined
  poppedSince: boolean
}

type PendingNavigation = PendingNavigationBase &
  ({ history: 'push'; id: number } | { history: 'replace' })

const pendingNavigation = globalSingleton('pending-navigation', () => ({
  current: null as PendingNavigation | null,
  nextId: 0
}))

function withoutEmptyFragment(href: string): string {
  return href.endsWith('#') ? href.slice(0, -1) : href
}

export function markPendingPush(url: URL): PendingPushState {
  const id = ++pendingNavigation.nextId
  pendingNavigation.current = {
    history: 'push',
    href: url.href,
    currentHref: url.href,
    id,
    routerIndex: history.state?.idx,
    poppedSince: false
  }
  return { ...history.state, [historyUpdateMarker]: id }
}

export function markPendingReplace(url: URL): void {
  pendingNavigation.current = {
    history: 'replace',
    href: url.href,
    currentHref: url.href,
    routerIndex: history.state?.idx,
    poppedSince: false
  }
}

function isOnPendingPushEntry(): boolean {
  const pending = pendingNavigation.current
  return (
    pending?.history === 'push' &&
    history.state?.[historyUpdateMarker] === pending.id &&
    // Shallow updates pass the starting state to pushState or replaceState.
    // The URL distinguishes the pending entry from the resulting marker copies.
    location.href === pending.currentHref
  )
}

function isOnPendingReplaceEntry(): boolean {
  const pending = pendingNavigation.current
  return pending?.history === 'replace' && location.href === pending.currentHref
}

function movePendingHref(): void {
  const pending = pendingNavigation.current
  if (pending) {
    pending.currentHref = location.href
  }
}

export function hasPendingPush(): boolean {
  const pending = pendingNavigation.current
  return pending?.history === 'push' && !pending.poppedSince
}

export function hasPendingReplace(): boolean {
  return pendingNavigation.current?.history === 'replace'
}

function clearPendingNavigation(): void {
  pendingNavigation.current = null
}

// Traversing forward onto an entry the router never committed leaves it
// with the index nuqs cloned from its predecessor. Repair it before
// the router reads it, so traversal deltas stay right (#1563).
function handlePopOnPendingNavigation(): void {
  const pending = pendingNavigation.current
  if (!pending) {
    return
  }
  if (pending.history === 'replace') {
    clearPendingNavigation()
    return
  }
  if (isOnPendingPushEntry() && typeof pending.routerIndex === 'number') {
    const { [historyUpdateMarker]: _, ...state } = history.state
    history.replaceState(
      { ...state, idx: pending.routerIndex + 1 },
      historyUpdateMarker
    )
    pendingNavigation.current = null
    return
  }
  pending.poppedSince = true
}

function pendingPushCommitUrl(url: string | URL): string | null {
  const pending = pendingNavigation.current
  if (
    pending?.history !== 'push' ||
    pending.poppedSince ||
    !isOnPendingPushEntry()
  ) {
    return null
  }
  const href = new URL(url, location.href).href
  return withoutEmptyFragment(href) === withoutEmptyFragment(pending.href)
    ? pending.currentHref
    : href
}

function pendingReplaceCommit(url: string | URL): string | URL {
  const pending = pendingNavigation.current
  if (pending?.history !== 'replace') {
    return url
  }
  const href = new URL(url, location.href).href
  return href === pending.href ? pending.currentHref : url
}

// React Router reads the optimistic entry's idx into its private index before
// it calls replaceState.
// This function can repair only the persisted entry.
// The router stays one behind until its next traversal reads the landed entry.
// The first Back computes a zero delta, so a blocker calls history.go(0).
// That call reloads the page; later traversals see the repaired indices.
function repairPendingPushReplaceState(
  state: History['state']
): History['state'] {
  const pending = pendingNavigation.current
  return pending?.history === 'push' &&
    !pending.poppedSince &&
    isOnPendingPushEntry() &&
    typeof pending.routerIndex === 'number' &&
    state?.idx === pending.routerIndex
    ? { ...state, idx: pending.routerIndex + 1 }
    : state
}

declare global {
  interface History {
    nuqs?: {
      version: string
      adapters: string[]
    }
  }
}

export function shouldPatchHistory(adapter: string): boolean {
  if (typeof history === 'undefined') {
    return false
  }
  if (history.nuqs?.version && history.nuqs.version !== version) {
    console.error(error(409), history.nuqs.version, version, adapter)
    return false
  }
  if (history.nuqs?.adapters?.includes(adapter)) {
    return false
  }
  return true
}

export function markHistoryAsPatched(adapter: string): void {
  history.nuqs = history.nuqs ?? {
    version,
    adapters: []
  }
  history.nuqs.adapters.push(adapter)
}

export function patchHistory(
  emitter: Emitter<SearchParamsSyncEmitterEvents>,
  adapter: string
): void {
  if (!shouldPatchHistory(adapter)) {
    return
  }
  let lastSearchSeen = typeof location === 'object' ? location.search : ''

  emitter.on('update', search => {
    const searchString = search.toString()
    lastSearchSeen = searchString.length ? '?' + searchString : ''
  })

  window.addEventListener(
    'popstate',
    () => {
      lastSearchSeen = location.search
      handlePopOnPendingNavigation()
      resetQueues()
    },
    { capture: true }
  )

  debug(21, version, adapter)
  function sync(url: URL | string) {
    spinQueueResetMutex()
    try {
      const newSearch = new URL(url, location.href).search
      if (newSearch === lastSearchSeen) {
        return
      }
    } catch {}
    try {
      emitter.emit('update', getSearchParams(url))
    } catch (e) {
      console.error(e)
    }
  }
  const originalPushState = history.pushState
  const originalReplaceState = history.replaceState
  history.pushState = function nuqs_pushState(state, marker, url) {
    if (marker === historyUpdateMarker || !url) {
      const onPendingReplaceEntry = isOnPendingReplaceEntry()
      originalPushState.call(history, state, '', url)
      if (onPendingReplaceEntry) {
        movePendingHref()
      }
      return
    }
    // The router committing an optimistic deep push must not add
    // a second entry (#1563).
    const commitUrl = pendingPushCommitUrl(url)
    const commit = commitUrl ? originalReplaceState : originalPushState
    clearPendingNavigation()
    commit.call(history, state, '', commitUrl ?? url)
    sync(commitUrl ?? url)
  }
  history.replaceState = function nuqs_replaceState(state, marker, url) {
    const onPendingEntry = isOnPendingPushEntry() || isOnPendingReplaceEntry()
    if (!url || marker === historyUpdateMarker) {
      originalReplaceState.call(history, state, '', url)
      if (onPendingEntry) {
        movePendingHref()
      }
      return
    }
    const commitUrl = pendingReplaceCommit(url)
    originalReplaceState.call(
      history,
      repairPendingPushReplaceState(state),
      '',
      commitUrl
    )
    // Back leaves the pending entry ahead; a replace elsewhere keeps its record.
    // Forward needs it to repair its index; every other replace spends it.
    if (onPendingEntry || hasPendingPush()) {
      clearPendingNavigation()
    }
    sync(commitUrl)
  }
  markHistoryAsPatched(adapter)
}
