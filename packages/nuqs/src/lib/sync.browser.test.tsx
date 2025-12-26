import React from 'react'
import { describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { withNuqsTestingAdapter } from '../adapters/testing'
import { parseAsInteger, useQueryState, useQueryStates } from '../index'
import { render } from 'vitest-browser-react'

type TestComponentProps = {
  testId: string
}

describe('sync', () => {
  it('should sync two hooks state', async () => {
    const TestComponent = ({ testId }: TestComponentProps) => {
      const [count, setCount] = useQueryState(
        'count',
        parseAsInteger.withDefault(0)
      )
      return (
        <button data-testid={testId} onClick={() => setCount(c => c + 1)}>
          count is {count}
        </button>
      )
    }

    const user = userEvent.setup()
    await render(
      <>
        <TestComponent testId="a" />
        <TestComponent testId="b" />
      </>,
      {
        wrapper: withNuqsTestingAdapter()
      }
    )
    // Act
    const buttonA = page.getByTestId('a')
    const buttonB = page.getByTestId('b')
    await user.click(buttonA)
    await expect.element(buttonA).toHaveTextContent('count is 1')
    await expect.element(buttonB).toHaveTextContent('count is 1')
    await user.click(buttonB)
    await expect.element(buttonA).toHaveTextContent('count is 2')
    await expect.element(buttonB).toHaveTextContent('count is 2')
  })

  it('should sync useQueryState and useQueryStates', async () => {
    const TestComponentA = ({ testId }: TestComponentProps) => {
      const [count, setCount] = useQueryState(
        'count',
        parseAsInteger.withDefault(0)
      )
      return (
        <button data-testid={testId} onClick={() => setCount(c => c + 1)}>
          count is {count}
        </button>
      )
    }
    const TestComponentB = ({ testId }: TestComponentProps) => {
      const [{ count }, setCount] = useQueryStates({
        count: parseAsInteger.withDefault(0)
      })
      return (
        <button
          data-testid={testId}
          onClick={() => setCount(c => ({ count: c.count + 1 }))}
        >
          count is {count}
        </button>
      )
    }

    const user = userEvent.setup()
    await render(
      <>
        <TestComponentA testId="a" />
        <TestComponentB testId="b" />
      </>,
      {
        wrapper: withNuqsTestingAdapter()
      }
    )
    // Act
    const buttonA = page.getByTestId('a')
    const buttonB = page.getByTestId('b')
    await user.click(buttonA)
    await expect.element(buttonA).toHaveTextContent('count is 1')
    await expect.element(buttonB).toHaveTextContent('count is 1')
    await user.click(buttonB)
    await expect.element(buttonA).toHaveTextContent('count is 2')
    await expect.element(buttonB).toHaveTextContent('count is 2')
  })
})
