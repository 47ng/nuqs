import { expect, test as it } from '@playwright/test'
import { defineTest } from '../define-test'
import { navigateTo } from '../playwright/navigate'

export const testRepro982 = defineTest('repro-982', ({ path }) => {
  it('keeps the first search param after an update when multiple ones occur', async ({
    page
  }) => {
    await navigateTo(page, path, '?test=pass&test=fail')
    await expect(page.locator('#client-state')).toHaveText('pass')
    await page.locator('button').click()
    await expect(page).toHaveURL(url => url.search === '?test=pass&test=fail&other=x')
    await expect(page.locator('#client-state')).toHaveText('pass')
  })
})
