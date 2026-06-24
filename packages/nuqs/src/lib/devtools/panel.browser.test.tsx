import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { page, userEvent } from 'vitest/browser'
import { debug, warn } from '../debug'
import { clearEvents } from './buffer'
import { eventClient } from './events'
import { NuqsDevtools } from './panel'
import { installNuqsDevtoolsSink } from './sink'

// The panel backfills from the buffer on mount, so events fired before render
// show up without a live devtools shell. Mock the bus emit to keep the
// EventClient from starting its connect/retry loop.
function seedSink() {
  vi.spyOn(eventClient, 'emit').mockImplementation(() => {})
  return installNuqsDevtoolsSink()
}

describe('NuqsDevtools panel', () => {
  let removeSink: (() => void) | undefined
  afterEach(() => {
    removeSink?.()
    removeSink = undefined
    clearEvents()
    vi.restoreAllMocks()
  })

  it('backfills and renders buffered events on mount', async () => {
    removeSink = seedSink()
    debug(20, 'react', new URL('https://example.com/?a=1'))
    warn(24, 'oops', new Error('bad value'))
    render(<NuqsDevtools />)
    await expect.element(page.getByText(/Updating url/)).toBeVisible()
    await expect.element(page.getByText(/Error while parsing/)).toBeVisible()
  })

  it('filters by free-text search over the message', async () => {
    removeSink = seedSink()
    debug(20, 'react', new URL('https://example.com/?a=1'))
    debug(8) // Skipping flush due to throttleMs=Infinity
    render(<NuqsDevtools />)
    await userEvent.fill(page.getByPlaceholder(/Filter/), 'Skipping')
    await expect.element(page.getByText(/Skipping flush/)).toBeVisible()
    await expect
      .element(page.getByText(/Updating url/))
      .not.toBeInTheDocument()
  })

  it('clears the log', async () => {
    removeSink = seedSink()
    debug(8)
    render(<NuqsDevtools />)
    await expect.element(page.getByText(/Skipping flush/)).toBeVisible()
    await userEvent.click(page.getByRole('button', { name: 'Clear' }))
    await expect.element(page.getByText(/No events/)).toBeVisible()
  })

  it('renders a URLSearchParams inspector when a row is expanded', async () => {
    removeSink = seedSink()
    debug(22, 'myKey', new URLSearchParams('foo=bar'))
    render(<NuqsDevtools />)
    await userEvent.click(page.getByText(/no change, returning previous/))
    await expect.element(page.getByText('foo', { exact: true })).toBeVisible()
    await expect.element(page.getByText('bar', { exact: true })).toBeVisible()
  })
})
