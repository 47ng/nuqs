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
