export const debugEnabled: boolean = isDebugEnabled()

export function debug(message: string, ...args: any[]): void {
  if (!debugEnabled) {
    return
  }
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
  if (!debugEnabled) {
    return
  }
  console.warn(message, ...args)
}

export function sprintf(base: string, ...args: any[]): string {
  return base.replace(/%[sfdO]/g, match => {
    const arg = args.shift()
    return match === '%O' && arg
      ? JSON.stringify(arg).replace(/"([^"]+)":/g, '$1:')
      : String(arg)
  })
}

function isDebugEnabled(): boolean {
  // Check if localStorage is available.
  // It may be unavailable in some environments,
  // like Safari in private browsing mode.
  // See https://github.com/47ng/nuqs/pull/588
  try {
    const test = 'nuqs-localStorage-test'
    if (typeof localStorage === 'undefined') {
      return false
    }
    localStorage.setItem(test, test)
    const isStorageAvailable = localStorage.getItem(test) === test
    localStorage.removeItem(test)
    return (
      isStorageAvailable &&
      (localStorage.getItem('debug') || '').includes('nuqs')
    )
  } catch {
    return false
  }
}
