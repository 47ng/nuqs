export function getUrlKey(
  urlKeys: Partial<Record<string, string>>,
  key: string
): string {
  return Object.prototype.hasOwnProperty.call(urlKeys, key)
    ? (urlKeys[key] ?? key)
    : key
}
