import React, { useState, type ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { renderHook } from 'vitest-browser-react'
import { NuqsTestingAdapter, withNuqsTestingAdapter } from './adapters/testing'
import { createParser, parseAsInteger } from './parsers'
import { useQueryState } from './useQueryState'

const parserP = createParser({
  parse: (query: string) => JSON.parse(query) as { value: number },
  serialize: JSON.stringify
})
const parserQ = createParser({
  parse: (query: string) => ({
    ...(JSON.parse(query) as { value: number }),
    parsedBy: 'Q'
  }),
  serialize: JSON.stringify
})

describe('useQueryState: publication identity', () => {
  it('keeps the writer value identity for every hook using its parser', async () => {
    const { result, act } = await renderHook(
      () => {
        const writer = useQueryState('shared', parserP)
        const otherParserReader = useQueryState('shared', parserQ)
        const sameParserReader = useQueryState('shared', parserP)
        return { writer, otherParserReader, sameParserReader }
      },
      { wrapper: withNuqsTestingAdapter() }
    )
    const exact = { value: 42 }

    await act(() => result.current.writer[1](exact))

    expect(result.current.writer[0]).toBe(exact)
    expect(result.current.otherParserReader[0]).toEqual({
      value: 42,
      parsedBy: 'Q'
    })
    expect(result.current.sameParserReader[0]).toBe(exact)
  })
})

describe('useQueryState: publication lifecycle', () => {
  it('re-parses a restored query after the key left the URL', async () => {
    let restoreUrl = () => {}
    function ExternalUrl({ children }: { children: ReactNode }) {
      const [search, setSearch] = useState('')
      restoreUrl = () => setSearch('n=1')
      return (
        <NuqsTestingAdapter searchParams={search} hasMemory>
          {children}
        </NuqsTestingAdapter>
      )
    }
    const { result, act } = await renderHook(
      () => useQueryState('n', parseAsInteger),
      { wrapper: ExternalUrl }
    )

    await act(() => result.current[1](1.4))
    expect(result.current[0]).toBe(1.4)
    await act(() => result.current[1](null))
    expect(result.current[0]).toBeNull()
    await act(() => restoreUrl())

    expect(result.current[0]).toBe(1)
  })
})
