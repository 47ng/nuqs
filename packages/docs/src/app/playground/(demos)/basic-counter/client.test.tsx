import { NuqsTestingAdapter } from 'nuqs/adapters/testing'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import BasicCounterDemoPage from './client'

describe('BasicCounterDemoPage accessibility', () => {
  const html = renderToStaticMarkup(
    <NuqsTestingAdapter>
      <BasicCounterDemoPage />
    </NuqsTestingAdapter>
  )

  it('names the icon-only counter controls', () => {
    expect(html).toContain('aria-label="Decrease counter"')
    expect(html).toContain('aria-label="Increase counter"')
  })

  it('announces counter updates as status changes', () => {
    expect(html).toContain('role="status"')
  })

  it('does not expose the counter controls as navigation', () => {
    expect(html).not.toContain('<nav')
  })
})
