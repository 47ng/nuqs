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
    expect(html).toContain('9 August 2026: v2.8.0')
  })

  it('removes the visual calendar from the accessibility tree', () => {
    const html = renderToStaticMarkup(
      <ReleaseContributionGraphClient
        activities={[{ date: '2026-08-09', count: 1, level: 2 }]}
        releasesByDate={{ '2026-08-09': ['v2.8.0'] }}
        stableCount={1}
        betaCount={0}
      />
    )
    const calendar = html.match(
      /<div[^>]*class="[^"]*overflow-x-auto[^"]*"[^>]*>/
    )?.[0]

    expect(calendar).toBeDefined()
    expect(calendar).toContain('aria-hidden="true"')
    expect(calendar).toContain('tabindex="-1"')
  })

  it('exposes the highlight state on its controls', () => {
    const html = renderToStaticMarkup(
      <ReleaseContributionGraphClient
        activities={[{ date: '2026-08-09', count: 1, level: 2 }]}
        releasesByDate={{ '2026-08-09': ['v2.8.0'] }}
        stableCount={1}
        betaCount={0}
      />
    )

    expect(html).toContain('aria-pressed="false"')
  })
})
