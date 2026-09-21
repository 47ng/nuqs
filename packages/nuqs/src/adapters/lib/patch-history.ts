import { debug } from '../../lib/debug'
import { createEmitter, type Emitter } from '../../lib/emitter'
import { error } from '../../lib/errors'
import { globalSingleton } from '../../lib/global-singleton'
import {
  resetQueues,
  setQueueResetMutex,
  spinQueueResetMutex
} from '../../lib/queues/reset'
import { getSearchParams } from '../../lib/search-params'
import { version } from '../../lib/version'

export type SearchParamsSyncEmitterEvents = {
  update: URLSearchParams
  pop: { index: number; delta: number }
}

export function getHistorySyncEmitter(
  adapter: string
): Emitter<SearchParamsSyncEmitterEvents> {
  return globalSingleton(`history-emitter.${adapter}`, () =>
    createEmitter<SearchParamsSyncEmitterEvents>()
  )
}

export const historyUpdateMarker = '__nuqs__'
const historyUpdateOffsetMarker = '__nuqs_offset__'

type PendingPushState = {
  [historyUpdateMarker]: number
  [historyUpdateOffsetMarker]: number
}

type PendingNavigationBlocker = {
  isCancelled: () => boolean
  unsubscribe?: () => void
  isAnyBlockerProceeding?: () => boolean
  isOriginalBlockerOpen?: () => boolean
}

type PendingNavigationBase = Partial<PendingNavigationBlocker> & {
  requestedHref: string
  entryHref: string
}

type PendingNavigation = PendingNavigationBase & {
  history: 'push' | 'replace'
  id: number | undefined
  offset: number
  routerIndex: number | undefined
}

const pendingNavigation = globalSingleton('pending-navigation', () => ({
  current: null as PendingNavigation | null,
  accepted: null as
    | (Pick<PendingNavigation, 'history' | 'requestedHref'> & {
        onCommit?: () => void
      })
    | null,
  cancelledPush: null as PendingNavigation | null,
  cancelledPushTraversal: null as
    'departing' | 'restoring' | 'proceeding' | null,
  cancelledPushDistance: null as number | null,
  nextId: 0
}))

function withoutEmptyFragment(href: string): string {
  return href.replace(/^([^#]*)#$/, '$1')
}

export function capturePendingNavigation(): (onCommit: () => void) => void {
  const current = getPendingNavigation()
  const accepted =
    pendingNavigation.accepted ??
    (current?.isOriginalBlockerOpen?.() ? null : current)
  pendingNavigation.accepted = null
  return onCommit => {
    pendingNavigation.accepted = accepted ? { ...accepted, onCommit } : null
  }
}

export function discardAcceptedNavigation(): void {
  pendingNavigation.accepted = null
}

function preserveAcceptedCommit(
  url: string | URL,
  history: 'push' | 'replace'
): boolean {
  const accepted = pendingNavigation.accepted
  if (
    accepted?.history !== history ||
    withoutEmptyFragment(new URL(url, location.href).href) !==
      withoutEmptyFragment(accepted.requestedHref)
  ) {
    return false
  }
  pendingNavigation.accepted = null
  accepted.onCommit?.()
  if (pendingNavigation.cancelledPush) {
    repairPendingPushIndex(pendingNavigation.cancelledPush)
  }
  return true
}

export function markPendingPush(
  url: URL,
  mode: 'push' | 'replace' = 'push'
): PendingPushState {
  clearCurrentPendingNavigation()
  clearCancelledPush()
  const id = ++pendingNavigation.nextId
  const state = { ...history.state }
  let routerIndex = state.idx
  if (typeof routerIndex === 'number') {
    routerIndex += getHistoryStateOffset(state) - (mode === 'replace' ? 1 : 0)
    state.idx = routerIndex
  }
  const offset = typeof routerIndex === 'number' ? 1 : 0
  pendingNavigation.current = {
    history: 'push',
    requestedHref: url.href,
    entryHref: url.href,
    id,
    offset,
    routerIndex
  }
  return {
    ...state,
    [historyUpdateMarker]: id,
    [historyUpdateOffsetMarker]: offset
  }
}

export function markPendingReplace(url: URL): void {
  clearCurrentPendingNavigation()
  pendingNavigation.current = {
    history: 'replace',
    requestedHref: url.href,
    entryHref: url.href,
    id: history.state?.[historyUpdateMarker],
    offset: getHistoryStateOffset(history.state),
    routerIndex: history.state?.idx
  }
}

export function setPendingNavigationBlocker({
  isCancelled,
  unsubscribe,
  isAnyBlockerProceeding,
  isOriginalBlockerOpen
}: PendingNavigationBlocker): void {
  const current = pendingNavigation.current
  if (current) {
    current.isCancelled = isCancelled
    current.unsubscribe = unsubscribe
    current.isAnyBlockerProceeding = isAnyBlockerProceeding
    current.isOriginalBlockerOpen = isOriginalBlockerOpen
  } else {
    unsubscribe?.()
  }
}

export function setPendingPopBlocker(
  isAnyBlockerProceeding: () => boolean
): void {
  if (pendingNavigation.current) {
    pendingNavigation.current.isAnyBlockerProceeding = isAnyBlockerProceeding
  }
}

export function onPendingNavigationEnd(onEnd: () => void): void {
  const current = pendingNavigation.current
  if (!current) {
    onEnd()
    return
  }
  const unsubscribe = current.unsubscribe
  current.unsubscribe = () => {
    unsubscribe?.()
    onEnd()
  }
}

export function interruptPendingPush(): () => boolean {
  const current = getPendingNavigation()
  if (current?.history !== 'push' || !isPendingPushEntry(current)) {
    return () => false
  }
  const state = history.state
  const interrupted = { ...current, unsubscribe: undefined }
  const queueResetMutex = cancelPendingNavigation()
  return () => {
    if (
      pendingNavigation.current ||
      pendingNavigation.cancelledPush !== current ||
      !isPendingPushEntry(current) ||
      interrupted.isCancelled?.()
    ) {
      return false
    }
    clearCancelledPush()
    history.replaceState(state, historyUpdateMarker)
    pendingNavigation.current = interrupted
    setQueueResetMutex(queueResetMutex)
    return true
  }
}

export function cancelPendingNavigation(onPop = false): number | undefined {
  const current = pendingNavigation.current
  const queueResetMutex = current ? setQueueResetMutex(1) : undefined
  if (current?.history === 'push' && (onPop || isPendingPushEntry(current))) {
    const isAnyBlockerProceeding = current.isAnyBlockerProceeding
    clearCurrentPendingNavigation()
    current.isAnyBlockerProceeding = isAnyBlockerProceeding
    pendingNavigation.cancelledPush = current
    if (!onPop && !pendingNavigation.accepted) {
      repairPendingPushIndex(current)
    }
    return queueResetMutex
  }
  clearCurrentPendingNavigation()
  return queueResetMutex
}

function getPendingNavigation(): PendingNavigation | null {
  if (pendingNavigation.current?.isCancelled?.()) {
    cancelPendingNavigation()
  }
  return pendingNavigation.current
}

function isPendingPushEntry(pending: PendingNavigation): boolean {
  return (
    history.state?.[historyUpdateMarker] === pending.id &&
    (pending.history === 'replace'
      ? getHistoryStateOffset(history.state)
      : history.state?.[historyUpdateOffsetMarker]) === pending.offset &&
    history.state?.idx === pending.routerIndex &&
    location.href === pending.entryHref
  )
}

function isOnPendingPushEntry(): boolean {
  const pending = getPendingNavigation()
  return pending?.history === 'push' && isPendingPushEntry(pending)
}

function isOnPendingReplaceEntry(): boolean {
  const pending = getPendingNavigation()
  return pending?.history === 'replace' && location.href === pending.entryHref
}

function isOnCancelledPushEntry(): boolean {
  const pending = pendingNavigation.cancelledPush
  return pending !== null && isPendingPushEntry(pending)
}

function movePendingHref(): void {
  for (const pending of [
    getPendingNavigation(),
    pendingNavigation.cancelledPush
  ]) {
    if (!pending) {
      continue
    }
    pending.entryHref = location.href
    if (history.state?.[historyUpdateMarker] === pending.id) {
      pending.routerIndex = history.state.idx
      pending.offset =
        history.state[historyUpdateOffsetMarker] ?? pending.offset
    }
  }
}

export function hasPendingPush(): boolean {
  return getPendingNavigation()?.history === 'push'
}

function clearCurrentPendingNavigation(): void {
  const current = pendingNavigation.current
  if (current) {
    current.unsubscribe?.()
    current.unsubscribe = undefined
    current.isCancelled = undefined
    current.isAnyBlockerProceeding = undefined
    current.isOriginalBlockerOpen = undefined
  }
  pendingNavigation.current = null
}

function clearCancelledPush(): void {
  if (pendingNavigation.cancelledPush) {
    pendingNavigation.cancelledPush.isAnyBlockerProceeding = undefined
  }
  pendingNavigation.cancelledPush = null
  pendingNavigation.cancelledPushTraversal = null
  pendingNavigation.cancelledPushDistance = null
}

function clearPendingNavigation(): void {
  pendingNavigation.accepted = null
  clearCurrentPendingNavigation()
  clearCancelledPush()
}

function getHistoryStateOffset(state: History['state']): number {
  return typeof state?.[historyUpdateOffsetMarker] === 'number'
    ? state[historyUpdateOffsetMarker]
    : 0
}

export function repairHistoryIndex(): number | undefined {
  const index = history.state?.idx
  if (typeof index !== 'number') {
    return
  }
  const offset = getHistoryStateOffset(history.state)
  if (offset !== 0) {
    history.replaceState(
      {
        ...history.state,
        idx: index + offset,
        [historyUpdateOffsetMarker]: 0
      },
      historyUpdateMarker
    )
  }
  return index + offset
}

function repairPendingPushIndex(pending: PendingNavigation): void {
  const index = repairHistoryIndex()
  if (index !== undefined) {
    pending.routerIndex = index
    pending.offset = 0
  }
}

function getCancelledPushDistance(pending: PendingNavigation): number | null {
  const targetOffset = history.state?.[historyUpdateOffsetMarker]
  if (
    typeof pending.routerIndex === 'number' &&
    typeof history.state?.idx === 'number'
  ) {
    return (
      pending.routerIndex +
      pending.offset -
      history.state.idx -
      getHistoryStateOffset(history.state)
    )
  }
  if (
    history.state?.[historyUpdateMarker] === pending.id &&
    typeof targetOffset === 'number'
  ) {
    return pending.offset - targetOffset
  }
  return null
}

function handlePopOnPendingNavigation(): void {
  if (
    pendingNavigation.current?.isOriginalBlockerOpen?.() ||
    pendingNavigation.current?.isCancelled?.()
  ) {
    cancelPendingNavigation(true)
  }
  if (
    !pendingNavigation.cancelledPush &&
    pendingNavigation.current?.isAnyBlockerProceeding
  ) {
    pendingNavigation.cancelledPush = pendingNavigation.current
  }
  const cancelledPush = pendingNavigation.cancelledPush
  if (cancelledPush) {
    if (pendingNavigation.cancelledPushTraversal === 'restoring') {
      if (isPendingPushEntry(cancelledPush)) {
        repairPendingPushIndex(cancelledPush)
        pendingNavigation.cancelledPushTraversal = null
        if (
          (pendingNavigation.current === cancelledPush &&
            cancelledPush.history === 'push') ||
          pendingNavigation.accepted?.history === 'push'
        ) {
          queueMicrotask(() => {
            if (
              (pendingNavigation.current === cancelledPush ||
                (pendingNavigation.accepted &&
                  pendingNavigation.cancelledPush === cancelledPush)) &&
              isPendingPushEntry(cancelledPush) &&
              typeof cancelledPush.routerIndex === 'number'
            ) {
              history.replaceState(
                {
                  ...history.state,
                  idx: cancelledPush.routerIndex - 1,
                  [historyUpdateOffsetMarker]: 1
                },
                historyUpdateMarker
              )
            }
          })
        }
      }
      return
    }
    if (pendingNavigation.cancelledPushTraversal === 'proceeding') {
      pendingNavigation.accepted = null
      clearCurrentPendingNavigation()
      clearCancelledPush()
    } else if (!isPendingPushEntry(cancelledPush)) {
      const distance = getCancelledPushDistance(cancelledPush)
      if (distance === null || distance < 1) {
        clearCancelledPush()
        return
      }
      pendingNavigation.cancelledPushDistance = distance
      pendingNavigation.cancelledPushTraversal = 'departing'
      setTimeout(() => {
        if (
          pendingNavigation.cancelledPushTraversal === 'departing' &&
          pendingNavigation.cancelledPush === cancelledPush
        ) {
          pendingNavigation.accepted = null
          if (pendingNavigation.current === cancelledPush) {
            clearCurrentPendingNavigation()
          }
          clearCancelledPush()
        }
      }, 0)
    }
  }
  if (pendingNavigation.current !== cancelledPush) {
    clearCurrentPendingNavigation()
  }
  if (!cancelledPush) {
    pendingNavigation.accepted = null
  }
}

function retargetPendingCommit(
  pending: PendingNavigationBase,
  url: string | URL
): string {
  const href = new URL(url, location.href).href
  if (
    withoutEmptyFragment(href) === withoutEmptyFragment(pending.requestedHref)
  ) {
    return pending.entryHref
  }
  // Redirects must not inherit the expected commit's queue protection.
  setQueueResetMutex(1)
  return href
}

function pendingPushCommitUrl(url: string | URL): string | null {
  const pending = getPendingNavigation()
  return pending?.history === 'push' && isPendingPushEntry(pending)
    ? retargetPendingCommit(pending, url)
    : null
}

function pendingReplaceCommit(url: string | URL): string | URL {
  const pending = getPendingNavigation()
  return pending?.history === 'replace'
    ? retargetPendingCommit(pending, url)
    : url
}

// This repairs the entry, not React Router's private index.
// The first blocked Back can still call history.go(0) and reload.
function repairPendingPushReplaceState(
  state: History['state']
): History['state'] {
  const pending = getPendingNavigation()
  return pending?.history === 'push' &&
    isPendingPushEntry(pending) &&
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
  adapter: string,
  { trackRouterHistory = false }: { trackRouterHistory?: boolean } = {}
): void {
  if (!shouldPatchHistory(adapter)) {
    return
  }
  let lastSearchSeen = typeof location === 'object' ? location.search : ''
  const readIndex = () =>
    typeof history.state?.idx === 'number'
      ? history.state.idx + getHistoryStateOffset(history.state)
      : undefined
  let lastHistoryIndex = readIndex()

  emitter.on('update', search => {
    const searchString = search.toString()
    lastSearchSeen = searchString.length ? '?' + searchString : ''
  })

  window.addEventListener(
    'popstate',
    () => {
      lastSearchSeen = location.search
      if (trackRouterHistory) {
        const index = readIndex()
        const previousIndex = lastHistoryIndex
        lastHistoryIndex = index
        if (index !== undefined && previousIndex !== undefined) {
          emitter.emit('pop', { index, delta: index - previousIndex })
        }
        handlePopOnPendingNavigation()
        repairHistoryIndex()
      }
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
  if (!trackRouterHistory) {
    for (const method of ['pushState', 'replaceState'] as const) {
      const original = history[method]
      history[method] = function nuqs_history(state, marker, url) {
        original.call(history, state, '', url)
        if (marker !== historyUpdateMarker && url) {
          sync(url)
        }
      }
    }
    markHistoryAsPatched(adapter)
    return
  }
  const nativePushState = history.pushState
  const nativeReplaceState = history.replaceState
  const originalPushState: History['pushState'] = function (...args) {
    nativePushState.apply(history, args)
    lastHistoryIndex = readIndex()
  }
  const originalReplaceState: History['replaceState'] = function (...args) {
    nativeReplaceState.apply(history, args)
    lastHistoryIndex = readIndex()
  }
  const originalGo = history.go
  history.go = function nuqs_go(delta) {
    const cancelledPush = pendingNavigation.cancelledPush
    const distance = pendingNavigation.cancelledPushDistance
    if (
      cancelledPush &&
      distance !== null &&
      pendingNavigation.cancelledPushTraversal === 'departing'
    ) {
      pendingNavigation.cancelledPushTraversal = 'restoring'
      originalGo.call(history, distance)
      return
    }
    if (
      cancelledPush &&
      distance !== null &&
      isPendingPushEntry(cancelledPush) &&
      cancelledPush.isAnyBlockerProceeding?.()
    ) {
      pendingNavigation.cancelledPushTraversal = 'proceeding'
      originalGo.call(history, -distance)
      return
    }
    originalGo.call(history, delta)
  }
  history.pushState = function nuqs_pushState(state, marker, url) {
    if (marker === historyUpdateMarker) {
      const onCancelledPush = isOnCancelledPushEntry()
      const onTrackedEntry = isOnPendingReplaceEntry() || onCancelledPush
      const current = getPendingNavigation()
      const isMarkedPendingPush =
        current?.history === 'push' &&
        !isPendingPushEntry(current) &&
        state?.[historyUpdateMarker] === current.id &&
        state?.[historyUpdateOffsetMarker] === current.offset
      const nextState =
        isMarkedPendingPush || typeof state?.idx !== 'number'
          ? state
          : {
              ...state,
              [historyUpdateOffsetMarker]:
                getHistoryStateOffset(history.state) + 1
            }
      originalPushState.call(history, nextState, '', url)
      if (onTrackedEntry) {
        movePendingHref()
      }
      if (
        onCancelledPush &&
        pendingNavigation.cancelledPush &&
        pendingNavigation.current !== pendingNavigation.cancelledPush &&
        !pendingNavigation.accepted
      ) {
        repairPendingPushIndex(pendingNavigation.cancelledPush)
      }
      if (onCancelledPush && pendingNavigation.cancelledPushDistance !== null) {
        pendingNavigation.cancelledPushDistance++
      }
      return
    }
    if (!url) {
      originalPushState.call(history, state, '', url)
      return
    }
    if (preserveAcceptedCommit(url, 'push')) {
      sync(location.href)
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
    const onTrackedEntry =
      isOnPendingPushEntry() ||
      isOnPendingReplaceEntry() ||
      isOnCancelledPushEntry()
    if (!url || marker === historyUpdateMarker) {
      originalReplaceState.call(history, state, '', url)
      if (onTrackedEntry) {
        movePendingHref()
      }
      return
    }
    if (preserveAcceptedCommit(url, 'replace')) {
      sync(location.href)
      return
    }
    const commitUrl = pendingReplaceCommit(url)
    originalReplaceState.call(
      history,
      repairPendingPushReplaceState(state),
      '',
      commitUrl
    )
    clearCurrentPendingNavigation()
    clearCancelledPush()
    sync(commitUrl)
  }
  markHistoryAsPatched(adapter)
}
