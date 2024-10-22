import type { NextRouter } from 'next/router'
import { debug } from './debug'
import type { Options, Router } from './defs'
import { error } from './errors'
import { renderQueryString } from './url-encoding'
import { getDefaultThrottle } from './utils'

export const FLUSH_RATE_LIMIT_MS = getDefaultThrottle()

type UpdateMap = Map<string, string | null>
const updateQueue: UpdateMap = new Map()
const queueOptions: Required<
  Omit<Options, 'startTransition' | 'clearOnDefault'>
> = {
  history: 'replace',
  scroll: false,
  shallow: true,
  throttleMs: FLUSH_RATE_LIMIT_MS
}
const transitionsQueue: Set<React.TransitionStartFunction> = new Set()

let lastFlushTimestamp = 0
let flushPromiseCache: Promise<URLSearchParams> | null = null

export function enqueueQueryStringUpdate<Value>(
  key: string,
  value: Value | null,
  serialize: (value: Value) => string,
  options: Pick<
    Options,
    'history' | 'scroll' | 'shallow' | 'startTransition' | 'throttleMs'
  >
) {
  const serializedOrNull = value === null ? null : serialize(value)
  debug('[nuqs queue] Enqueueing %s=%s %O', key, serializedOrNull, options)
  updateQueue.set(key, serializedOrNull)
  // Any item can override an option for the whole batch of updates
  if (options.history === 'push') {
    queueOptions.history = 'push'
  }
  if (options.scroll) {
    queueOptions.scroll = true
  }
  if (options.shallow === false) {
    queueOptions.shallow = false
  }
  if (options.startTransition) {
    // Providing a startTransition function will
    // cause the update to be non-shallow.
    transitionsQueue.add(options.startTransition)
    queueOptions.shallow = false
  }
  queueOptions.throttleMs = Math.max(
    options.throttleMs ?? FLUSH_RATE_LIMIT_MS,
    Number.isFinite(queueOptions.throttleMs) ? queueOptions.throttleMs : 0
  )
  return serializedOrNull
}

export function getQueuedValue(key: string) {
  return updateQueue.get(key) ?? null
}

/**
 * Eventually flush the update queue to the URL query string.
 *
 * This takes care of throttling to avoid hitting browsers limits
 * on calls to the history pushState/replaceState APIs, and defers
 * the call so that individual query state updates can be batched
 * when running in the same event loop tick.
 *
 * @returns a Promise to the URLSearchParams that have been applied.
 */
export function scheduleFlushToURL(router: Router) {
  if (flushPromiseCache === null) {
    flushPromiseCache = new Promise<URLSearchParams>((resolve, reject) => {
      if (!Number.isFinite(queueOptions.throttleMs)) {
        debug('[nuqs queue] Skipping flush due to throttleMs=Infinity')
        resolve(new URLSearchParams(location.search))
        // Let the promise be returned before clearing the cached value
        setTimeout(() => {
          flushPromiseCache = null
        }, 0)
        return
      }
      function flushNow() {
        lastFlushTimestamp = performance.now()
        const [search, error] = flushUpdateQueue(router)
        if (error === null) {
          resolve(search)
        } else {
          reject(search)
        }
        flushPromiseCache = null
      }
      // We run the logic on the next event loop tick to allow
      // multiple query updates to set their own throttleMs value.
      function runOnNextTick() {
        const now = performance.now()
        const timeSinceLastFlush = now - lastFlushTimestamp
        const throttleMs = queueOptions.throttleMs
        const flushInMs = Math.max(
          0,
          Math.min(throttleMs, throttleMs - timeSinceLastFlush)
        )
        debug(
          '[nuqs queue] Scheduling flush in %f ms. Throttled at %f ms',
          flushInMs,
          throttleMs
        )
        if (flushInMs === 0) {
          // Since we're already in the "next tick" from queued updates,
          // no need to do setTimeout(0) here.
          flushNow()
        } else {
          setTimeout(flushNow, flushInMs)
        }
      }
      setTimeout(runOnNextTick, 0)
    })
  }
  return flushPromiseCache
}

declare global {
  interface Window {
    next?: {
      version: string
      router?: NextRouter & {
        state: {
          asPath: string
        }
      }
    }
  }
}

function flushUpdateQueue(router: Router): [URLSearchParams, null | unknown] {
  const search = new URLSearchParams(location.search)
  if (updateQueue.size === 0) {
    return [search, null]
  }
  // Work on a copy and clear the queue immediately
  const items = Array.from(updateQueue.entries())
  const options = { ...queueOptions }
  const transitions = Array.from(transitionsQueue)
  // Restore defaults
  updateQueue.clear()
  transitionsQueue.clear()
  queueOptions.history = 'replace'
  queueOptions.scroll = false
  queueOptions.shallow = true
  queueOptions.throttleMs = FLUSH_RATE_LIMIT_MS
  debug('[nuqs queue] Flushing queue %O with options %O', items, options)
  for (const [key, value] of items) {
    if (value === null) {
      search.delete(key)
    } else {
      search.set(key, value)
    }
  }
  try {
    // While the Next.js team doesn't recommend using internals like this,
    // we need access to the pages router here to let it know about non-shallow
    // updates, as going through the window.history API directly will make it
    // miss pushed history updates.
    // The router adapter imported from next/navigation also doesn't support
    // passing an asPath, causing issues in dynamic routes in the pages router.
    const nextRouter = window.next?.router
    const isPagesRouter = typeof nextRouter?.state?.asPath === 'string'
    if (isPagesRouter) {
      const url = renderURL(nextRouter.state.asPath.split('?')[0] ?? '', search)
      debug('[nuqs queue (pages)] Updating url: %s', url)
      const method =
        options.history === 'push' ? nextRouter.push : nextRouter.replace
      method.call(nextRouter, url, url, {
        scroll: options.scroll,
        shallow: options.shallow
      })
    } else {
      // App router
      const url = renderURL(location.origin + location.pathname, search)
      debug('[nuqs queue (app)] Updating url: %s', url)
      // First, update the URL locally without triggering a network request,
      // this allows keeping a reactive URL if the network is slow.
      const updateMethod =
        options.history === 'push' ? history.pushState : history.replaceState
      updateMethod.call(
        history,
        // In next@14.1.0, useSearchParams becomes reactive to shallow updates,
        // but only if passing `null` as the history state.
        null,
        '',
        url
      )
      if (options.scroll) {
        window.scrollTo(0, 0)
      }
      if (!options.shallow) {
        compose(transitions, () => {
          // Call the Next.js router to perform a network request
          // and re-render server components.
          router.replace(url, {
            scroll: false
          })
        })
      }
    }
    return [search, null]
  } catch (err) {
    // This may fail due to rate-limiting of history methods,
    // for example Safari only allows 100 updates in a 30s window.
    console.error(error(429), items.map(([key]) => key).join(), err)
    return [search, err]
  }
}

function renderURL(base: string, search: URLSearchParams) {
  const hashlessBase = base.split('#')[0] ?? ''
  const query = renderQueryString(search)
  const hash = location.hash
  return hashlessBase + query + hash
}

export function compose(
  fns: React.TransitionStartFunction[],
  final: () => void
) {
  const recursiveCompose = (index: number) => {
    if (index === fns.length) {
      return final()
    }
    const fn = fns[index]
    if (!fn) {
      throw new Error('Invalid transition function')
    }
    fn(() => recursiveCompose(index + 1))
  }
  recursiveCompose(0)
}
