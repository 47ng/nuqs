import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  withNuqsTestingAdapter,
  type OnUrlUpdateFunction
} from 'nuqs/adapters/testing'
import { describe, expect, it, vi } from 'vitest'
import { SearchInput } from './search-input'

describe('SearchInput', () => {
  it('should render the input with state loaded from the URL', () => {
    render(<SearchInput />, {
      wrapper: withNuqsTestingAdapter({ searchParams: { search: 'nuqs' } })
    })
    const input = screen.getByRole('search')
    expect(input).toHaveValue('nuqs')
  })
  it('should follow the user typing text', async () => {
    const user = userEvent.setup()
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>()
    render(<SearchInput />, {
      wrapper: withNuqsTestingAdapter({
        onUrlUpdate
      })
    })
    const expectedState = 'Hello, world!'
    const expectedParam = 'Hello,+world!'
    const searchInput = screen.getByRole('search')
    await user.type(searchInput, expectedState)
    expect(searchInput).toHaveValue(expectedState)
    expect(onUrlUpdate).toHaveBeenCalledTimes(expectedParam.length)
    for (let i = 0; i < expectedParam.length; i++) {
      expect(onUrlUpdate.mock.calls[i][0].queryString).toBe(
        `?search=${expectedParam.slice(0, i + 1)}`
      )
    }
  })
})
