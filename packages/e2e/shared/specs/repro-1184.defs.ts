import { createLoader, parseAsInteger } from 'nuqs/server'

export const repro1184SearchParams = {
  counter: parseAsInteger.withDefault(0)
}

const loadSearchParams = createLoader(repro1184SearchParams)

export async function repro1184Loader(request: Request) {
  const { counter } = loadSearchParams(request)
  await new Promise(resolve => setTimeout(resolve, 500))
  return { counter }
}
