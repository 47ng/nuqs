import React from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { NuqsAdapter } from './adapters/react'
import { parseAsInteger } from './parsers'
import { useQueryState } from './useQueryState'

describe('useQueryStates: server rendering', () => {
  it('does not throw when a setter is called during a server render', () => {
    function App() {
      const [n, setN] = useQueryState('n', parseAsInteger)
      if (n === null) {
        void setN(1)
      }
      return <span>{n ?? 'empty'}</span>
    }
    expect(
      renderToString(
        <NuqsAdapter>
          <App />
        </NuqsAdapter>
      )
    ).toBe('<span>empty</span>')
  })
})
