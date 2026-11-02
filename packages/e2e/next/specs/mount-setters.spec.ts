import { expect, test as it } from '@playwright/test'
import { expectSearch } from 'e2e-shared/playwright/expect-url.ts'
import { navigateTo } from 'e2e-shared/playwright/navigate.ts'

// State set from a layout effect in the commit that brings in a new route must
// reach the URL. The adapter resets its queues when a route commits: that reset
// must only drop updates queued before the commit, not the ones queued by the
// committed route's own layout effects.
it.describe('app router - layout-effect setters on route commit', () => {
  it('keeps destination page and layout updates after router.replace', async ({
    page
  }) => {
    await navigateTo(page, '/app/mount-setters/src')
    await expectSearch(page, { nav: 'src' })
    await page.getByRole('button', { name: 'Replace to destination' }).click()
    await expect(page.locator('#init')).toHaveText('init: ready')
    await expectSearch(page, { existing: '1', init: 'ready', nav: 'dest' })
  })
})
