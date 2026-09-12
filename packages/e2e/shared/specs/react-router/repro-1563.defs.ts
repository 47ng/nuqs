import { parseAsStringLiteral } from 'nuqs/server'

const history = parseAsStringLiteral(['push', 'replace'])

export const reproHistoryOptions = {
  testHistory: history.withDefault('push'),
  otherHistory: history.withDefault('replace'),
  shallowHistory: history.withDefault('replace')
}

const loaderCalls = new Map<string, number>()

export function countLoaderCall(request: Request): number {
  const loaderId = new URL(request.url).searchParams.get('loaderId') ?? ''
  const call = (loaderCalls.get(loaderId) ?? 0) + 1
  loaderCalls.set(loaderId, call)
  return call
}
