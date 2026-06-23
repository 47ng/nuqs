// React Router v8 uses the same `react-router` package and hooks as v7, so this
// adapter re-exports the v7 implementation as-is. It exists so consumers can pin
// to `nuqs/adapters/react-router/v8`, letting the two diverge in a future release
// if v8 ever needs different handling.
export { NuqsAdapter, useOptimisticSearchParams } from './v7'
