import { useRouter } from 'next/navigation.js' // https://github.com/47ng/next-usequerystate/discussions/352

export type Router = ReturnType<typeof useRouter>

export type HistoryOptions = 'replace' | 'push'

export type Options = {
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
  shallow?: boolean
}

export type Nullable<T> = {
  [K in keyof T]: T[K] | null
}
