import { addDebugSink, isDebugFlagSet } from './lib/debug'
import { debugMessages, sprintf } from './lib/debug-messages'

// Side-effect-only entry point (`nuqs/debug`): importing it opts client-side
// debug logging into the bundle. The format-string catalog and formatting logic
// live here rather than in the core, so they only ship when a consumer imports
// this module.
//
// Logging stays gated behind the `debug=nuqs` key in localStorage — set it and
// reload, as before. Server-side, `nuqs/server` wires this in automatically,
// gated by the `DEBUG=nuqs` env var (the server bundle has more headroom).
//
// @example
// ```ts
// import 'nuqs/debug'         // once, anywhere in your app
// // Enable logs at runtime:
// localStorage.debug = 'nuqs' // on the client
// process.env.DEBUG  = 'nuqs' // on the server
// ```
function installDebugSink(): void {
  addDebugSink((code, args, isWarn) => {
    const message = debugMessages[code]
    if (isWarn) {
      console.warn(message, ...args)
      return
    }
    const formatted = sprintf(message, ...args)
    performance.mark(formatted)
    try {
      // Handle React Devtools not being able to console.log('%s', null)
      console.log(message, ...args)
    } catch {
      console.log(formatted)
    }
  })
}

// Respect the localStorage/DEBUG flag as soon as this entry loads, so
// `import 'nuqs/debug'` is all that's needed to turn logging on.
if (isDebugFlagSet()) {
  installDebugSink()
}
