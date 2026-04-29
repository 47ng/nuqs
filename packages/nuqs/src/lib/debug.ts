export const debugEnabled: boolean = isDebugEnabled()

export function debug(message: string, ...args: any[]): void {
  if (!debugEnabled) return
  const msg = sprintf(message, ...args)
  performance.mark(msg)
  try {
    // Handle React Devtools not being able to console.log('%s', null)
    console.log(message, ...args)
  } catch {
    console.log(msg)
  }
}

export function warn(message: string, ...args: any[]): void {
  if (debugEnabled) console.warn(message, ...args)
}

export function sprintf(base: string, ...args: any[]): string {
  return base.replace(/%[sfdO]/g, m => {
    const a = args.shift()
    return m === '%O' && a
      ? JSON.stringify(a).replace(/"([^"]+)":/g, '$1:')
      : String(a)
  })
}

function isDebugEnabled(): boolean {
  // Backend (Node/server): use DEBUG env var, never touch localStorage. #1336
  if (typeof window === 'undefined') {
    return !!process.env.DEBUG?.includes('nuqs')
  }
  // localStorage may be unavailable (e.g. Safari private mode). #588
  try {
    if (typeof localStorage === 'undefined') return false
    const k = 'nuqs-localStorage-test'
    localStorage.setItem(k, k)
    const ok = localStorage.getItem(k) === k
    localStorage.removeItem(k)
    return ok && !!localStorage.getItem('debug')?.includes('nuqs')
  } catch {
    return false
  }
}
