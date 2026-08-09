import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ReleaseContributionGraphClient } from './release-contribution-graph.client'

describe('ReleaseContributionGraphClient accessibility', () => {
  it('provides a text equivalent for release details', () => {
    const html = renderToStaticMarkup(
      <ReleaseContributionGraphClient
        activities={[{ date: '2026-08-09', count: 1, level: 2 }]}
        releasesByDate={{ '2026-08-09': ['v2.8.0'] }}
        stableCount={1}
        betaCount={0}
      />
    )

    expect(html).toContain('aria-label="Releases by date"')
    expect(html).toContain('2026-08-09: v2.8.0')
    expect(html).toContain('aria-hidden="true" tabindex="-1"')
    expect(html).toContain('aria-pressed="false"')
    expect(html).toContain('Stable (1)')
    expect(html).not.toContain('aria-label="Highlight stable releases"')
  })
})
