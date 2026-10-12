import type { Options } from '../../defs'

export type AdapterOptions = Pick<Options, 'history' | 'scroll' | 'shallow'>

/**
 * Optionally return a Promise that resolves when the router has fully applied
 * the update (eg: after navigation and route loaders settle). It is passed to
 * the user's startTransition, keeping its isPending flag true until settlement
 * on React 19. The Promise should not reject: rejections bypass nuqs and
 * surface through React's transition error handling.
 */
export type UpdateUrlFunction = (
  search: URLSearchParams,
  options: Required<AdapterOptions>
) => void | Promise<void>

export type UseAdapterHook = (watchKeys: string[]) => AdapterInterface

export type AdapterInterface = {
  searchParams: URLSearchParams
  pathname?: string
  updateUrl: UpdateUrlFunction
  getSearchParamsSnapshot?: () => URLSearchParams
  rateLimitFactor?: number
  autoResetQueueOnUpdate?: boolean
}
