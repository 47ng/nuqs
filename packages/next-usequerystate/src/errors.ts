export const errors = {
  409: 'Multiple versions of the library are loaded. This may lead to unexpected behavior. Currently using %s, but %s was about to load on top.',
  429: 'URL update rate-limited by the browser. Consider increasing `throttleMs` for keys %s. %O'
} as const

export function error(code: keyof typeof errors, ...args: any[]) {
  const message = `[next-usequerystate] ${errors[code]}
  See https://err.47ng.com/NUQS-${code}`
  console.error(message, ...args)
}
