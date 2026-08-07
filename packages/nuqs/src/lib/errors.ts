export const errors = {
  303: 'Multiple adapter contexts detected. This might happen in monorepos.',
  404: 'nuqs requires an adapter to work with your framework.',
  409: 'Multiple copies of the library are loaded. This may lead to unexpected behavior. Currently using `%s`, but `%s` (via %s) was about to load on top.',
  414: 'Max safe URL length exceeded. Some browsers may not be able to accept this URL. Consider limiting the amount of state stored in the URL.',
  429: 'URL update rate-limited by the browser. Consider increasing `throttleMs` for key(s) `%s`. %O',
  500: "Empty search params cache. Search params can't be accessed in Layouts.",
  501: 'Search params cache already populated. Have you called `parse` twice?',
  502: '`processUrlSearchParams` threw while processing key(s) `%s`. %O'
} as const

export function error(code: keyof typeof errors) {
  return `[nuqs] ${errors[code]}
  See https://nuqs.dev/NUQS-${code}`
}
