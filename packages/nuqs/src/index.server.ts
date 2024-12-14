/** @deprecated Import createSearchParamsCache from 'nuqs/server/cache' instead.
 *
 * This export will be removed from 'nuqs/server' in nuqs@3.0.0,
 * to allow non-Next.js server code to use the parsers, serializeres and other
 * server-side utilities without depending on React canary for the `cache` function.
 */
export { createSearchParamsCache } from './cache'
export type {
  HistoryOptions,
  Nullable,
  Options,
  SearchParams,
  UrlKeys
} from './defs'
export {
  createLoader,
  type LoaderFunction,
  type LoaderInput,
  type LoaderOptions
} from './loader'
export * from './parsers'
export { createSerializer } from './serializer'
