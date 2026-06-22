// Debug log messages, keyed by the numeric code passed to `debug`/`warn`.
//
// Kept out of the client main bundle on purpose: only the `nuqs/debug` entry
// (`src/debug.ts`) and the server entry (`src/index.server.ts`) import these
// values, so the format strings never reach the client `index.js` unless logging
// is opted into via `import 'nuqs/debug'`. The server bundle pulls them in
// eagerly (it has more headroom). Call sites in the core pass the code only —
// mirroring the `errors.ts` code-catalog pattern.
export const debugMessages = {
  // useQueryStates
  1: '[nuq+ %s `%s`] State changed: %O',
  2: '[nuq+ %s `%s`] Cross-hook key sync %s: %O (default: %O). no change, skipping, resolved: %O',
  3: '[nuq+ %s `%s`] Cross-hook key sync %s: %O (default: %O). updateInternalState, resolved: %O',
  4: '[nuq+ %s `%s`] Subscribing to sync for `%s`',
  5: '[nuq+ %s `%s`] Unsubscribing to sync for `%s`',
  6: '[nuq+ %s `%s`] setState: %O',
  // Throttle queue (gtq)
  7: '[nuqs gtq] Enqueueing %s=%s %O',
  8: '[nuqs gtq] Skipping flush due to throttleMs=Infinity',
  9: '[nuqs gtq] Scheduling flush in %f ms. Throttled at %f ms (x%f)',
  10: '[nuqs gtq] Resetting queue %s',
  11: '[nuqs gtq] Applying %d pending update(s) on top of %s',
  12: '[nuqs gtq] Flushing queue %O with options %O',
  // Debounce queue (dq / dqc)
  13: '[nuqs dq] Flushing debounce queue %O',
  14: '[nuqs dq] Reset debounce queue %O',
  15: '[nuqs dqc] Creating debounce queue for `%s`',
  16: '[nuqs dqc] Cleaning up empty queue for `%s`',
  17: '[nuqs dqc] Enqueueing debounce update %O',
  18: '[nuqs dqc] Aborting debounce queue %s=%s',
  // Queue reset
  19: '[nuqs] Aborting queues',
  // Adapters
  20: '[nuqs %s] Updating url: %s',
  21: '[nuqs %s] Patching history (%s adapter)',
  22: '[nuqs `%s`] no change, returning previous: %O',
  23: `[nuqs \`%s\`] subbed search params change
  from %O
  to   %O`,
  // safe-parse
  24: '[nuqs] Error while parsing value `%s`: %O',
  25: '[nuqs] Error while parsing value `%s`: %O (for key `%s`)'
} as const

/**
 * The set of valid debug codes — the keys of {@link debugMessages}.
 *
 * This makes the catalog the single source of truth for which codes exist:
 * `debug`/`warn` only accept a `DebugCode`, so an out-of-range code is a type
 * error at the call site.
 */
export type DebugCode = keyof typeof debugMessages

// The type of a `%s` argument. `sprintf` (and the browser console) coerce with
// `String(arg)`, so anything with a `toString` — `URL`, `URLSearchParams`,
// primitives… — is valid. (`%d`/`%f` narrow to `number`; `%O` accepts `unknown`.)
type Stringifiable = { toString(): string } | null | undefined
type ArgType<Spec extends string> = Spec extends 'O'
  ? unknown
  : Spec extends 'd' | 'f'
    ? number
    : Spec extends 's'
      ? Stringifiable
      : never

// Walk a format string left → right, accumulating one tuple slot per
// %s/%d/%f/%O placeholder — mirroring `sprintf`'s `/%[sfdO]/g`. The `infer`-led
// prefix matches the *first* `%`, so placeholders are parsed in order.
type ParseArgs<
  S extends string,
  Acc extends unknown[] = []
> = S extends `${infer _Pre}%${infer Rest}`
  ? Rest extends `${infer Spec}${infer Tail}`
    ? Spec extends 's' | 'd' | 'f' | 'O'
      ? ParseArgs<Tail, [...Acc, ArgType<Spec>]>
      : ParseArgs<Rest, Acc>
    : Acc
  : Acc

/**
 * The argument tuple a debug code requires, derived from the `%` placeholders in
 * its message. The catalog string is therefore the single source of truth for
 * both the set of codes ({@link DebugCode}) and the shape of their arguments.
 */
export type DebugArgs<Code extends DebugCode> = ParseArgs<
  (typeof debugMessages)[Code]
>

export function sprintf(base: string, ...args: any[]): string {
  return base.replace(/%[sfdO]/g, match => {
    const arg = args.shift()
    return match === '%O' && arg
      ? JSON.stringify(arg).replace(/"([^"]+)":/g, '$1:')
      : String(arg)
  })
}
