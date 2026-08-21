import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ReactRouter, TanStackRouter, Waku } from './frameworks'

describe('framework icons', () => {
  it('exposes informative icons as named images', () => {
    const html = renderToStaticMarkup(<ReactRouter />)
    expect(html).toContain('role="img"')
    expect(html).toContain('aria-label="React Router"')
    const tanstack = renderToStaticMarkup(<TanStackRouter />)
    expect(tanstack).toContain('role="img"')
    expect(tanstack).toContain('aria-label="TanStack Router"')
    const waku = renderToStaticMarkup(<Waku />)
    expect(waku).toContain('role="img"')
    expect(waku).toContain('aria-label="Waku"')
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
