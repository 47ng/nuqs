import { NuqsTestingAdapter } from 'nuqs/adapters/testing'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import BasicCounterDemoPage from './client'

describe('BasicCounterDemoPage accessibility', () => {
  it('names the icon-only counter controls', () => {
    const html = renderToStaticMarkup(
      <NuqsTestingAdapter>
        <BasicCounterDemoPage />
      </NuqsTestingAdapter>
    )

    expect(html).toContain('aria-label="Decrease counter"')
    expect(html).toContain('aria-label="Increase counter"')
    expect(html).toContain('role="status"')
    expect(html).not.toContain('<nav')
  })
})
