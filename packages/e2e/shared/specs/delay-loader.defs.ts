import { createLoader, parseAsInteger } from 'nuqs/server'

const loadDelay = createLoader({
  delay: parseAsInteger.withDefault(0)
})

export async function delayedLoader(request: Request) {
  const { delay } = loadDelay(request)
  if (delay) {
    await new Promise(resolve => setTimeout(resolve, delay))
  }
  return null
}
