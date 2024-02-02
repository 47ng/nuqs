import { parseAsInteger } from 'nuqs/server'

export const parser = parseAsInteger.withDefault(0).withOptions({
  history: 'push'
})
