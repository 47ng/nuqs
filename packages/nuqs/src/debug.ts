const enabled = isDebugEnabled()

export function debug(message: string, ...args: any[]) {
  if (!enabled) {
    return
  }
  const msg = sprintf(message, ...args)
  performance.mark(msg)
  try {
    // Handle React Devtools not being able to console.log('%s', null)
    console.log(message, ...args)
  } catch (error) {
    console.log(msg)
  }
}

export function warn(message: string, ...args: any[]) {
  if (!enabled) {
    return
  }
  console.warn(message, ...args)
}

export function sprintf(base: string, ...args: any[]) {
  return base.replace(/%[sfdO]/g, match => {
    const arg = args.shift()
    if (match === '%O' && arg) {
      return JSON.stringify(arg).replace(/"([^"]+)":/g, '$1:')
    } else {
      return String(arg)
    }
  })
}

function isDebugEnabled() {
  // Check if localStorage is available.
  // It may be unavailable in some environments,
  // like Safari in private browsing mode.
  // See https://github.com/47ng/nuqs/pull/588
  try {
    if (typeof localStorage === 'undefined') {
      return false
    }
    const test = 'nuqs-localStorage-test'
    localStorage.setItem(test, test)
    const isStorageAvailable = localStorage.getItem(test) === test
    localStorage.removeItem(test)
    if (!isStorageAvailable) {
      return false
    }
  } catch (error) {
    console.error(
      '[nuqs]: debug mode is disabled (localStorage unavailable).',
      error
    )
    return false
  }
  const debug = localStorage.getItem('debug') ?? ''
  return debug.includes('nuqs')
}
