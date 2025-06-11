// Source:
// https://www.bennadel.com/blog/4195-using-abortcontroller-to-debounce-settimeout-calls-in-javascript.htm

export function timeout(
  callback: () => void,
  ms: number,
  signal: AbortSignal
): void {
  function onTick() {
    callback()
    signal.removeEventListener('abort', onAbort)
  }
  const id = setTimeout(onTick, ms)
  function onAbort() {
    clearTimeout(id)
    signal.removeEventListener('abort', onAbort)
  }
  signal.addEventListener('abort', onAbort)
}
