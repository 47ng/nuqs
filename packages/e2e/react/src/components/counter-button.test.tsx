import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  withNuqsTestingAdapter,
  type UrlUpdateEvent
} from 'nuqs/adapters/testing'
import { describe, expect, it, vi } from 'vitest'
import { CounterButton } from './counter-button'

describe('CounterButton', () => {
  it('should render the button with state loaded from the URL', () => {
    render(<CounterButton />, {
      wrapper: withNuqsTestingAdapter({ searchParams: '?count=42' })
    })
    expect(screen.getByRole('button')).toHaveTextContent('count is 42')
  })
  it('should increment the count when clicked', async () => {
    const user = userEvent.setup()
    const onUrlUpdate = vi.fn<[UrlUpdateEvent]>()
    render(<CounterButton />, {
      wrapper: withNuqsTestingAdapter({
        searchParams: '?count=42',
        onUrlUpdate
      })
    })
    const button = screen.getByRole('button')
    await user.click(button)
    expect(button).toHaveTextContent('count is 43')
    expect(onUrlUpdate).toHaveBeenCalledOnce()
    expect(onUrlUpdate.mock.calls[0][0].queryString).toBe('?count=43')
    expect(onUrlUpdate.mock.calls[0][0].searchParams.get('count')).toBe('43')
    expect(onUrlUpdate.mock.calls[0][0].options.history).toBe('push')
  })
})
