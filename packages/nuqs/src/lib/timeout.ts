// Source:
// https://www.bennadel.com/blog/4195-using-abortcontroller-to-debounce-settimeout-calls-in-javascript.htm

export function timeout(
  callback: () => void,
  ms: number,
  signal: AbortSignal
): void {
  const off = () => signal.removeEventListener('abort', onAbort)
  const id = setTimeout(() => {
    callback()
    off()
  }, ms)
  function onAbort() {
    clearTimeout(id)
    off()
  }
  signal.addEventListener('abort', onAbort)
}
