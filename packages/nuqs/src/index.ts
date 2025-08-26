export type {
  HistoryOptions,
  Nullable,
  Options,
  SearchParams,
  UrlKeys
} from './defs'
export {
  debounce,
  defaultRateLimit,
  throttle
} from './lib/queues/rate-limiting'
export {
  createLoader,
  type LoaderFunction,
  type LoaderInput,
  type LoaderOptions
} from './loader'
export * from './parsers'
export { createSerializer, type CreateSerializerOptions } from './serializer'
export { createStandardSchemaV1 } from './standard-schema'
export * from './useQueryState'
export * from './useQueryStates'

export const removeMe =
  'adding some changes in the nuqs package to test bundle size increase'
