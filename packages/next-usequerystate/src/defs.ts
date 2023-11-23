import { useRouter } from 'next/navigation.js' // https://github.com/47ng/next-usequerystate/discussions/352
import type { TransitionStartFunction } from 'react'

export type Router = ReturnType<typeof useRouter>

export type HistoryOptions = 'replace' | 'push'

type StartTransition<T> = T extends false
  ? TransitionStartFunction
  : T extends true
  ? never
  : T extends unknown
  ? TransitionStartFunction
  : never

export type Options<Shallow = unknown> = {
  /**
   * How the query update affects page history
   *
   * `push` will create a new history entry, allowing to use the back/forward
   * buttons to navigate state updates.
   * `replace` (default) will keep the current history point and only replace
   * the query string.
   */
  history?: HistoryOptions

  /**
   * Scroll to top after a query state update
   *
   * Defaults to `false`, unlike the Next.js router page navigation methods.
   */
  scroll?: boolean

  /**
   * Shallow mode (true by default) keeps query states update client-side only,
   * meaning there won't be calls to the server.
   *
   * Setting it to `false` will trigger a network request to the server with
   * the updated querystring.
   */
  shallow?: Extract<Shallow | boolean, boolean>

  /**
   * Maximum amount of time (ms) to wait between updates of the URL query string.
   *
   * This is to alleviate rate-limiting of the Web History API in browsers,
   * and defaults to 50ms. Safari requires a much higher value of around 340ms.
   *
   * Note: the value will be limited to a minimum of 50ms, anything lower
   * will not have any effect.
   */
  throttleMs?: number

  /**
   * Opt-in to observing Server Component loading states when doing
   * non-shallow updates by passing a `startTransition` from the
   * `React.useTransition()` hook.
   *
   * Using this will set the `shallow` setting to `false` automatically.
   * As a result, you can't set both `shallow: true` and `startTransition`
   * in the same Options object.
   */
  startTransition?: StartTransition<Shallow>
}

export type Nullable<T> = {
  [K in keyof T]: T[K] | null
}
