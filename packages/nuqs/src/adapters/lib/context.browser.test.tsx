import React, { useState, type ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { page } from 'vitest/browser'
import { parseAsString } from '../../parsers'
import { useQueryState } from '../../useQueryState'
import { unstable_createAdapterProvider } from '../custom'
import { NuqsAdapter as ReactAdapter } from '../react'

const searchParams = new URLSearchParams('?a=init')
const CustomAdapter = unstable_createAdapterProvider(() => ({
  searchParams,
  updateUrl() {}
}))

function Consumer({ onRender }: { onRender: () => void }) {
  const [a] = useQueryState('a', parseAsString)
  onRender()
  return <span>{a}</span>
}

function RerenderingParent({
  adapter: Adapter,
  children
}: {
  adapter: (props: { children: ReactNode }) => React.ReactElement
  children: ReactNode
}) {
  const [count, setCount] = useState(0)
  return (
    <>
      <button onClick={() => setCount(c => c + 1)}>rerender {count}</button>
      <Adapter>{children}</Adapter>
    </>
  )
}

describe('adapter context value', () => {
  it.each([
    ['createAdapterProvider', CustomAdapter],
    ['the React adapter', ReactAdapter]
  ])(
    'does not re-render consumers when the parent of %s re-renders without a URL change',
    async (_, Adapter) => {
      const onRender = vi.fn()
      await render(
        <RerenderingParent adapter={Adapter}>
          <Consumer onRender={onRender} />
        </RerenderingParent>
      )
      onRender.mockClear()
      await page.getByRole('button').click()
      await expect.element(page.getByText('rerender 1')).toBeInTheDocument()
      expect(onRender).not.toHaveBeenCalled()
    }
  )
})
