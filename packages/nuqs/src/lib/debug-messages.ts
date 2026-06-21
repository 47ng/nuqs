// Debug log messages, keyed by the numeric code passed to `debug`/`warn`.
//
// Kept out of the main bundle on purpose: this catalog is only imported by the
// `nuqs/debug` entry point (see `src/debug.ts`), so the format strings don't
// ship to consumers unless they opt into logging. Call sites in the core pass
// the code only — mirroring the `errors.ts` code-catalog pattern.
export const debugMessages: Record<number, string> = {
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
  13: '[nuqs dq] Flushing debounce queue',
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
  22: '[nuqs `%s`] no change, returning previous',
  23: `[nuqs \`%s\`] subbed search params change
  from %O
  to   %O`,
  // safe-parse
  24: '[nuqs] Error while parsing value `%s`: %O',
  25: '[nuqs] Error while parsing value `%s`: %O (for key `%s`)',
  // useQueryStates (render)
  26: '[nuq+ %s `%s`] render - state: %O, iSP: %s'
}

export function sprintf(base: string, ...args: any[]): string {
  return base.replace(/%[sfdO]/g, match => {
    const arg = args.shift()
    return match === '%O' && arg
      ? JSON.stringify(arg).replace(/"([^"]+)":/g, '$1:')
      : String(arg)
  })
}
