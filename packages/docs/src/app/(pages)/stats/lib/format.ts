const LOCALE = 'en-GB'

/**
 * Format a date-ish object to a locale-friendly string
 */
export function formatDate(
  date?: Date | string | number,
  defaultValue: string = '',
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }
) {
  if (!date) {
    return defaultValue
  }
  // https://css-tricks.com/how-to-convert-a-date-string-into-a-human-readable-format/
  return new Date(date).toLocaleDateString(LOCALE, options)
}

export function formatTime(date: Date | string | number) {
  return new Date(date).toLocaleTimeString(LOCALE, {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit'
  })
}

const numberFormat = Intl.NumberFormat(LOCALE)

export function formatNumber(value: number) {
  return numberFormat.format(value)
}

export function formatSEOKeyValues(dict: Record<string, string>) {
  return Object.keys(dict).flatMap((key, index) => [
    { name: `twitter:label${index + 1}`, content: key },
    { name: `twitter:data${index + 1}`, content: dict[key] }
  ])
}

export function formatStatNumber(
  number: number,
  options: Intl.NumberFormatOptions = {}
): string {
  return number.toLocaleString(LOCALE, {
    notation: 'compact',
    unitDisplay: 'short',
    ...options
  })
}
