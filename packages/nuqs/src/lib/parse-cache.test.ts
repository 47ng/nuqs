import { describe, expect, it, vi } from 'vitest'
import { parseWithCache } from './parse-cache'

type AnyQuery = string & Array<string>

const asQuery = (query: string) => query as AnyQuery

// This file runs in the node project (no `window`): parseWithCache must
// bypass the module-scoped cache entirely, otherwise parsed values (and
// their object identities) would be shared across server requests.
describe('parseWithCache (server)', () => {
  it('does not cache on the server', () => {
    const parse = vi.fn((query: string) => ({ value: query }))
    const a = parseWithCache('ssr-bypass', parse, asQuery('foo'))
    const b = parseWithCache('ssr-bypass', parse, asQuery('foo'))
    expect(parse).toHaveBeenCalledTimes(2)
    expect(a).toEqual({ value: 'foo' })
    expect(b).toEqual({ value: 'foo' })
    expect(b).not.toBe(a)
  })
})
