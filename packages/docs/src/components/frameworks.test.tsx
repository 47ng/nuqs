import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ReactRouter, TanStackRouter } from './frameworks'

describe('framework icons', () => {
  it('gives informative SVG icons image semantics', () => {
    expect(renderToStaticMarkup(<ReactRouter />)).toContain('role="img"')
  })

  it('does not expose an accessible name when marked presentational', () => {
    const html = renderToStaticMarkup(<ReactRouter role="presentation" />)

    expect(html).not.toContain('aria-label')
  })

  it('uses empty alt text for a presentational image icon', () => {
    const html = renderToStaticMarkup(<TanStackRouter role="presentation" />)

    expect(html).toContain('alt=""')
  })
})
