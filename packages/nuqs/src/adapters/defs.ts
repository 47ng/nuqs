import type { Options } from '../defs'

export type AdapterOptions = Pick<Options, 'history' | 'scroll' | 'shallow'>

export type UpdateUrlFunction = (
  search: URLSearchParams,
  options: Required<AdapterOptions>
) => void

export type UseAdapterHook = () => AdapterInterface

export type AdapterInterface = {
  searchParams: URLSearchParams
  updateUrl: UpdateUrlFunction
  rateLimitFactor?: number
}
