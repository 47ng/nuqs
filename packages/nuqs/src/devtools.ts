import { isDebugFlagSet } from './lib/debug'
import { installNuqsDevtoolsSink } from './lib/devtools/sink'

// Opt-in entry point (`nuqs/devtools`). Importing it (for the panel below, or as
// a bare side-effect import) installs a debug sink that forwards nuqs internals
// to a TanStack Devtools panel over the EventClient bus.
//
// Activation is client-only. In development it is always on; in production it
// rides the same `localStorage.debug=nuqs` flag as `nuqs/debug`. The EventClient
// queues then drops if no panel is mounted, so this is inert when the devtools
// aren't open.
//
// @example
// ```tsx
// import { TanStackDevtools } from '@tanstack/react-devtools'
// import { NuqsDevtools } from 'nuqs/devtools'
//
// <TanStackDevtools plugins={[{ name: 'nuqs', render: <NuqsDevtools /> }]} />
// ```
export { NuqsDevtools } from './lib/devtools/panel'
export type { NuqsLogEvent } from './lib/devtools/events'

if (
  typeof window !== 'undefined' &&
  (process.env.NODE_ENV !== 'production' || isDebugFlagSet())
) {
  installNuqsDevtoolsSink()
}
