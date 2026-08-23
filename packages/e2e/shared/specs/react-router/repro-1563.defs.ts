import { createLoader, parseAsInteger } from 'nuqs/server'

export const loadDelay = createLoader({
  delay: parseAsInteger.withDefault(0)
})
