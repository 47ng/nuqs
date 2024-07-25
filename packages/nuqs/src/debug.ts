import { isLocalStorageAvailable } from './utils';

// todo: Remove check for `next-usequerystate` in v2
let enabled = false

try {
  enabled =
    (isLocalStorageAvailable() &&
      (localStorage.getItem('debug')?.includes('next-usequerystate') ||
        localStorage.getItem('debug')?.includes('nuqs'))) ||
    false
} catch (error) {
  console.error(
    '[nuqs]: debug mode is disabled (localStorage unavailable).',
    error
  )
}

export function debug(message: string, ...args: any[]) {
  if (!enabled) {
    return
  }
  const msg = sprintf(message, ...args)
  performance.mark(msg)
  console.log(message, ...args)
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
