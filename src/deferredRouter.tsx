import Router from 'next/router'
import { ParsedUrlQuery } from 'querystring'
import React, { useContext, useReducer, useRef } from 'react'

type QueryObject = Record<string, string | null>

type RouteChangeQueryPayload =
  | QueryObject
  | ((prev: QueryObject) => QueryObject)

/**
 * Wraps next router so that routing is deferred to the next render cycle,
 * Query parameters are merged together so that multiple router.push doesn't overwrite each other.
 *
 * WARNING: Currently only takes query part of the route. Cannot route to other pathname.
 */
class DeferredRouter {
  forceRender: () => void
  queue: RouteChangeQueryPayload[] = []
  shouldPush: boolean = false
  renderTriggered: boolean = false

  constructor(forceRender: () => void) {
    this.forceRender = forceRender
  }

  clear() {
    this.queue = []
    this.shouldPush = false
    this.renderTriggered = false
  }

  push(query: Record<string, string>) {
    this.change('push', query)
  }

  replace(query: Record<string, string>) {
    this.change('replace', query)
  }

  change(history: 'push' | 'replace', query: RouteChangeQueryPayload) {
    if (history === 'push') this.shouldPush = true
    this.queue.push(query)

    // Trigger force render so that flush() would be called.
    // Needs to queueMicrotask because rerender happened between multiple calls to this method.
    // This problem occured when using lodash.debounce.
    // Might even need to use setTimeout if other timing issues occur.
    if (!this.renderTriggered) {
      queueMicrotask(() => this.forceRender())
      // this.renderTriggered is required for triggering rerender only once.
      // Using queueMicrotask caused the need for triggering rerender only once.
      this.renderTriggered = true
    }
  }

  async flush() {
    // Apply each query parameter changes to current url query
    // Query string state must be handled as a Record to allow updater functions.
    const newQuery = this.queue.reduce<QueryObject>((acc, cur) => {
      const payload = isUpdaterFunction(cur) ? cur(acc) : cur
      // ignore undefined values
      Object.entries(payload).forEach(
        ([key, value]) => value === undefined && delete payload[key]
      )
      return { ...acc, ...payload }
    }, getFirstParams(Router.query))

    // Remove null values from url
    Object.keys(newQuery).forEach(
      key => newQuery[key] === undefined && delete newQuery[key]
    )

    const routePromise = (this.shouldPush ? Router.push : Router.replace)({
      hash: window.location.hash, // Needed?
      query: newQuery
    })

    this.clear()

    return routePromise
  }
}
function getFirstParams(query: ParsedUrlQuery): Record<string, string> {
  const firstParams: Record<string, string> = {}
  for (const key in query) {
    const value = Array.isArray(query[key]) ? query[key]?.[0] : query[key]
    if (value !== undefined) firstParams[key] = value as string
  }
  return firstParams
}

const DeferredRouterContext = React.createContext<DeferredRouter | null>(null)

/** Provider required to use useDeferredRouter */
export const DeferredRouterProvider: React.FC = props => {
  const [_, forceRender] = useReducer(prev => prev + 1, 0)
  const deferredRouter = useRef(new DeferredRouter(forceRender))

  if (deferredRouter.current.queue.length) {
    deferredRouter.current.flush()
  }

  return (
    <DeferredRouterContext.Provider value={deferredRouter.current}>
      {props.children}
    </DeferredRouterContext.Provider>
  )
}

export function useDeferredRouter() {
  return useContext(DeferredRouterContext)
}

function isUpdaterFunction<T extends QueryObject>(
  input: T | ((prevState: T) => T)
): input is (prevState: T) => T {
  return typeof input === 'function'
}
