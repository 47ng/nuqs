export function nuqsSafeParse<I, R>(
  parser: (arg: I) => R,
  value: I,
  key?: string
): R | null {
  try {
    return parser(value)
  } catch (error) {
    console.error(
      '[nuqs] Error while parsing value `%s`: %O' +
        (key ? ' (for key `%s`)' : ''),
      value,
      error,
      key
    )
    return null
  }
}
