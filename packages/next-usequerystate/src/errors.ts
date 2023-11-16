export const errors = {
  409: 'Multiple versions of the library are loaded. This may lead to unexpected behavior. Currently using %s, but %s was about to load on top.',
  429: 'URL update rate-limited by the browser. Consider increasing `throttleMs` for keys %s. %O',
  500: 'Empty search params cache. Call `parseSearchParams` in the page component to set it up.',
  501: 'Search params cache already populated. Have you called `parse` twice?'
} as const

export function error(code: keyof typeof errors) {
  return `[next-usequerystate] ${errors[code]}
  See https://err.47ng.com/NUQS-${code}`
}
