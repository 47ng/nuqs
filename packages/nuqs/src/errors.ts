export const errors = {
  409: 'Multiple versions of the library are loaded. This may lead to unexpected behavior. Currently using `%s`, but `%s` was about to load on top.',
  429: 'URL update rate-limited by the browser. Consider increasing `throttleMs` for key(s) `%s`. %O',
  500: "Empty search params cache. Search params can't be accessed in Layouts.",
  501: 'Search params cache already populated. Have you called `parse` twice?'
} as const

export function error(code: keyof typeof errors) {
  return `[nuqs] ${errors[code]}
  See https://err.47ng.com/NUQS-${code}`
}
