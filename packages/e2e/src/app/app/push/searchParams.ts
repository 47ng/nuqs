import { parseAsInteger } from 'nuqs'

export const parser = parseAsInteger.withDefault(0).withOptions({
  history: 'push'
})
