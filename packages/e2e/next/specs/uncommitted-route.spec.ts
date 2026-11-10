import { expect, test as it, type Page } from '@playwright/test'
import { navigateTo } from 'e2e-shared/playwright/navigate.ts'
import { createRequire } from 'node:module'

// A destination route can render (and run its render-time setters, see #1358)
// long before it commits. Each kind below keeps it uncommitted the way real
// apps do:
// - rsc: an async Server Component without a loading.tsx / Suspense boundary
// - promise: a Server Component promise unwrapped with `use()` on the client
// - cpu: a slow client render (eg: a large table on a slow device)
const kinds = ['rsc', 'promise', 'cpu'] as const

// Before Next 16, a second navigation does not abandon a slow client render:
// the cpu route still commits, and its defaults are then written while the
// second navigation is pending, which drops it (as on the base branch).
const nextMajor = Number.parseInt(
  createRequire(import.meta.url)('next/package.json').version,
  10
)

function recordLogs(page: Page) {
  const logs: string[] = []
  page.on('console', message => logs.push(message.text()))
  return logs
}

// The setter Promises must only resolve with values the URL actually held.
function expectTruthfulResolutions(logs: string[]) {
  const resolutions = logs.flatMap(log => {
    const match = log.match(/^init resolved \w+: (\S+) \| url=(\S+)$/)
    return match ? [{ resolved: match[1]!, url: match[2]! }] : []
  })
  for (const { resolved, url } of resolutions) {
    const actual = new URL(url, 'http://localhost').searchParams
    const expected = new URLSearchParams(resolved === '(empty)' ? '' : resolved)
    for (const [key, value] of expected) {
      expect
        .soft(actual.get(key), `resolved ${key}=${value} but the URL is ${url}`)
        .toBe(value)
    }
  }
}

it.describe(
  'app router - updates from a route that has not committed yet',
  () => {
    for (const kind of kinds) {
      it(`${kind}: writes the destination defaults once it commits`, async ({
        page
      }) => {
        const logs = recordLogs(page)
        await navigateTo(page, '/app/uncommitted-route/a')
        await page.getByRole('link', { name: `to ${kind}` }).click()
        await expect(page.locator('#results')).toBeVisible({ timeout: 10_000 })
        await expect(page).toHaveURL(
          url =>
            url.pathname.endsWith(`/uncommitted-route/${kind}`) &&
            url.searchParams.get('mode') === 'default' &&
            url.searchParams.get('filter') === `default-${kind}`
        )
        await expect(page.locator('#bar')).toHaveText(
          `mode: default · filter: default-${kind}`
        )
        expectTruthfulResolutions(logs)
      })

      it(`${kind}: leaves no unwritten values when the navigation is abandoned`, async ({
        page
      }) => {
        it.skip(
          kind === 'cpu' && nextMajor < 16,
          `requires Next >= 16 (got Next ${nextMajor})`
        )
        const logs = recordLogs(page)
        await navigateTo(page, '/app/uncommitted-route/a')
        await page.getByRole('link', { name: `to ${kind}` }).click()
        // Let the destination render and its first URL flush go by,
        // then navigate elsewhere before it commits.
        await page.waitForTimeout(kind === 'cpu' ? 150 : 600)
        await page.getByRole('link', { name: 'to a' }).click()
        await expect(page).toHaveURL(
          url => url.searchParams.get('other') === '1'
        )
        // Wait past the destination's suspension, then check that the mounted
        // filter bar still reflects the URL.
        await page.waitForTimeout(2000)
        await expect(page).toHaveURL(
          url =>
            url.pathname.endsWith('/uncommitted-route/a') &&
            !url.searchParams.has('mode')
        )
        await expect(page.locator('#bar')).toHaveText(
          'mode: null · filter: null'
        )
        expect(
          logs.filter(log => log.startsWith('bar: mode=default')),
          'the filter bar rendered values the URL never held'
        ).toEqual([])
        expectTruthfulResolutions(logs)
      })
    }
  }
)
