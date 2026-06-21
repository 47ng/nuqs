import { enableNuqsDebugging } from './debug'
import { isDebugEnabled } from './lib/debug'

// Server-side debug logging is enabled by the `DEBUG=nuqs` env var, as before.
// The client gates logging behind `import 'nuqs/debug'` to keep its bundle lean;
// the server bundle has more headroom, so we wire the log messages in eagerly.
if (isDebugEnabled()) {
  enableNuqsDebugging()
}

export { createSearchParamsCache } from './cache'
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
  type LoaderOptions,
  type CreateLoaderOptions
} from './loader'
export * from './parsers'
export { createSerializer, type CreateSerializerOptions } from './serializer'
export {
  createStandardSchemaV1,
  type CreateStandardSchemaV1Options
} from './standard-schema'
