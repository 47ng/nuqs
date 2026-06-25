import { expect, test as it } from '@playwright/test'
import { expectUrl } from 'e2e-shared/playwright/expect-url.ts'
import { assertLogCount, setupLogSpy } from 'e2e-shared/playwright/log-spy.ts'
import { navigateTo } from 'e2e-shared/playwright/navigate.ts'

// A useQueryStates hook hoisted into a shared layout must stay in sync with the
// URL while navigating between the sibling routes it spans. The tricky case: a
// same-search cross-route navigation (/a?q=1 -> /b?q=1) does not change the
// search, so the hook's URL-sync key is unchanged — yet the route did change.
// If the hook fails to notice the route change, the next search update on the
// new route (/b?q=1 -> /b?q=2) paints the previous value for a frame.
it.describe('app router - shared-layout hook stays in sync across navigation', () => {
  it('does not commit a stale value after a same-search cross-route navigation', async ({
    page
  }) => {
    using logSpy = setupLogSpy(page)
    await navigateTo(page, '/app/shared-layout-sync/a', '?q=1')
    await expect(page.locator('#filter')).toHaveText('q: 1')

    // Same-search cross-route navigation: /a?q=1 -> /b?q=1
    await page.getByRole('link', { name: 'B1' }).click()
    await expectUrl(
      page,
      url => url.pathname.endsWith('/b') && url.searchParams.get('q') === '1'
    )
    await expect(page.locator('#filter')).toHaveText('q: 1')

    // Change the search on the new route: /b?q=1 -> /b?q=2
    logSpy.logs.length = 0
    await page.getByRole('link', { name: 'B2' }).click()
    await expectUrl(page, url => url.searchParams.get('q') === '2')
    // Await the corrected commit on the log channel first (flushes console
    // delivery), then assert no stale value slipped through. Asserting the
    // negative first would pass before the logs arrive (see repro-1273).
    await expect
      .poll(() => logSpy.logs.filter(l => l === 'commit: 2').length)
      .toBeGreaterThan(0)
    await assertLogCount(
      logSpy,
      'commit: 1',
      0,
      'Expected no stale committed value on the revisited route'
    )
    await expect(page.locator('#filter')).toHaveText('q: 2')
  })
})
