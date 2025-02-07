export function timeout(callback: () => void, ms: number, signal: AbortSignal) {
  const id = setTimeout(callback, ms)
  signal.addEventListener('abort', () => clearTimeout(id))
}
