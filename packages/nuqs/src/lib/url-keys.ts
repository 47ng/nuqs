export function getOwn<T>(
  object: Partial<Record<string, T>>,
  key: PropertyKey
): T | undefined {
  if (Object.hasOwn(object, key)) return object[key as string]
}

export function getUrlKey(
  urlKeys: Partial<Record<string, string>>,
  key: string
): string {
  return getOwn(urlKeys, key) ?? key
}
