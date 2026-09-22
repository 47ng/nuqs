import { assertType, describe, it } from 'vitest'
import { configure, type ConfigureOptions } from '../dist'

describe('types/configure', () => {
  it('accepts the pretty-encoding opt-out', () => {
    assertType<void>(configure({ prettyEncoding: false }))
    assertType<void>(configure({ prettyEncoding: true }))
    const options = { prettyEncoding: false } satisfies ConfigureOptions
    assertType<ConfigureOptions>(options)
  })
})
