import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ReactRouter, TanStackRouter } from './frameworks'

describe('framework icons', () => {
  it('keeps accessible names for informative icons', () => {
    expect(renderToStaticMarkup(<ReactRouter />)).toContain(
      'aria-label="React Router"'
    )
    expect(renderToStaticMarkup(<ReactRouter />)).toContain('role="img"')
    expect(renderToStaticMarkup(<TanStackRouter />)).toContain(
      'alt="TanStack Router"'
    )
  })

  it('does not expose an accessible name when marked presentational', () => {
    const html = renderToStaticMarkup(<ReactRouter role="presentation" />)

    expect(html).toContain('role="presentation"')
    expect(html).not.toContain('aria-label')
  })

  it('uses empty alt text for a presentational image icon', () => {
    const html = renderToStaticMarkup(<TanStackRouter role="presentation" />)

    expect(html).toContain('role="presentation"')
    expect(html).toContain('alt=""')
  })
})
