export function getOwn<T>(
  object: Partial<Record<string, T>>,
  key: PropertyKey
): T | undefined {
  return Object.hasOwn(object, key) ? object[key as string] : undefined
}

export function getUrlKey(
  urlKeys: Partial<Record<string, string>>,
  key: string
): string {
  return getOwn(urlKeys, key) ?? key
}
