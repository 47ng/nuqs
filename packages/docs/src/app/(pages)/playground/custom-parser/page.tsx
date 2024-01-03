'use client'

import { createParser, useQueryState } from 'next-usequerystate'

type SortingState = Record<string, 'asc' | 'desc'>

const parser = createParser({
  parse(value) {
    if (value === '') {
      return null
    }
    const keys = value.split('|')
    return keys.reduce<SortingState>((acc, key) => {
      const [id, desc] = key.split(':')
      acc[id] = desc === 'desc' ? 'desc' : 'asc'
      return acc
    }, {})
  },
  serialize(value: SortingState) {
    return Object.entries(value)
      .map(([id, dir]) => `${id}:${dir}`)
      .join('|')
  }
})

export default function BasicCounterDemoPage() {
  const [sort, setSort] = useQueryState('sort', parser.withDefault({}))
  return (
    <section>
      <h1>Custom parser</h1>
      <nav style={{ display: 'flex', gap: '4px' }}>
        <span>Foo</span>
        <button
          style={{ padding: '2px 12px' }}
          onClick={() =>
            setSort(state => ({
              ...state,
              foo: 'asc'
            }))
          }
        >
          🔼
        </button>
        <button
          style={{ padding: '2px 12px' }}
          onClick={() =>
            setSort(state => ({
              ...state,
              foo: 'desc'
            }))
          }
        >
          🔽
        </button>
        <button
          style={{ padding: '2px 12px' }}
          onClick={() =>
            setSort(({ foo: _, ...state }) =>
              Object.keys(state).length === 0 ? null : state
            )
          }
        >
          Clear
        </button>
        <span>{sort.foo}</span>
      </nav>
      <nav style={{ display: 'flex', gap: '4px' }}>
        <span>Bar</span>
        <button
          style={{ padding: '2px 12px' }}
          onClick={() =>
            setSort(state => ({
              ...state,
              bar: 'asc'
            }))
          }
        >
          🔼
        </button>
        <button
          style={{ padding: '2px 12px' }}
          onClick={() =>
            setSort(state => ({
              ...state,
              bar: 'desc'
            }))
          }
        >
          🔽
        </button>
        <button
          style={{ padding: '2px 12px' }}
          onClick={() =>
            setSort(({ bar: _, ...state }) =>
              Object.keys(state).length === 0 ? null : state
            )
          }
        >
          Clear
        </button>
        <span>{sort.bar}</span>
      </nav>
      <p>
        <a href="https://github.com/47ng/next-usequerystate/tree/next/packages/docs/src/app/(pages)/playground/custom-parser/page.tsx">
          Source on GitHub
        </a>
      </p>
    </section>
  )
}
