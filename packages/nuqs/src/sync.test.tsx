import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { describe, expect, it } from 'vitest'
import { NuqsTestingAdapter } from './adapters/testing'
import { parseAsInteger, useQueryState, useQueryStates } from './index'

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
    render(
      <>
        <TestComponent testId="a" />
        <TestComponent testId="b" />
      </>,
      {
        wrapper: ({ children }) => (
          <NuqsTestingAdapter>{children}</NuqsTestingAdapter>
        )
      }
    )
    // Act
    const buttonA = screen.getByTestId('a')
    const buttonB = screen.getByTestId('b')
    await user.click(buttonA)
    expect(buttonA).toHaveTextContent('count is 1')
    expect(buttonB).toHaveTextContent('count is 1')
    await user.click(buttonB)
    expect(buttonA).toHaveTextContent('count is 2')
    expect(buttonB).toHaveTextContent('count is 2')
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
    render(
      <>
        <TestComponentA testId="a" />
        <TestComponentB testId="b" />
      </>,
      {
        wrapper: ({ children }) => (
          <NuqsTestingAdapter>{children}</NuqsTestingAdapter>
        )
      }
    )
    // Act
    const buttonA = screen.getByTestId('a')
    const buttonB = screen.getByTestId('b')
    await user.click(buttonA)
    expect(buttonA).toHaveTextContent('count is 1')
    expect(buttonB).toHaveTextContent('count is 1')
    await user.click(buttonB)
    expect(buttonA).toHaveTextContent('count is 2')
    expect(buttonB).toHaveTextContent('count is 2')
  })
})
