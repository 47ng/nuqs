import { createLoader, parseAsInteger } from 'nuqs/server'

const loaderCalls = new Map<string, number>()

export function countLoaderCall(request: Request): number {
  const loaderId = new URL(request.url).searchParams.get('loaderId') ?? ''
  const call = (loaderCalls.get(loaderId) ?? 0) + 1
  loaderCalls.set(loaderId, call)
  return call
}

export const loadDelay = createLoader({
  delay: parseAsInteger.withDefault(0)
})
