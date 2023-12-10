import { parseAsInteger } from 'next-usequerystate'

export const parser = parseAsInteger.withDefault(0).withOptions({
  history: 'push'
})
