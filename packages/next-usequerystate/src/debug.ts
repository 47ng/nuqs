const enabled =
  (typeof localStorage === 'object' &&
    localStorage.getItem('debug')?.includes('next-usequerystate')) ??
  false

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
