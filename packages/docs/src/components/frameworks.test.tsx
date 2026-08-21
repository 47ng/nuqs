import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ReactRouter, TanStackRouter } from './frameworks'

describe('framework icons', () => {
  it('exposes informative icons as named images', () => {
    const html = renderToStaticMarkup(<ReactRouter />)
    expect(html).toContain('role="img"')
    expect(html).toContain('aria-label="React Router"')
    expect(renderToStaticMarkup(<TanStackRouter />)).toContain(
      'alt="TanStack Router"'
    )
  })

  it('lets callers hide decorative icons', () => {
    expect(renderToStaticMarkup(<ReactRouter aria-hidden />)).toContain(
      'aria-hidden="true"'
    )
    expect(renderToStaticMarkup(<TanStackRouter aria-hidden />)).toContain(
      'aria-hidden="true"'
    )
  })
})
