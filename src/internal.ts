export function getPathname(asPath: string) {
  return asPath.split(/\?|#/, 1)[0]
}
