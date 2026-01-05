import { expect, test as it } from '@playwright/test'
import { defineTest } from '../define-test'
import { createSearchMatcher } from '../playwright/expect-url'
import { navigateTo } from '../playwright/navigate'

export const testRepro982 = defineTest('repro-982', ({ path, isHashRouter }) => {
  it('keeps the first search param after an update when multiple ones occur', async ({
    page
  }) => {
    await navigateTo(page, path, '?test=pass&test=fail', { isHashRouter })
    await expect(page.locator('#client-state')).toHaveText('pass')
    await page.locator('button').click()
    await expect(page).toHaveURL(
      createSearchMatcher(
        '?test=pass&test=fail&other=x',
        isHashRouter ?? false
      )
    )
    await expect(page.locator('#client-state')).toHaveText('pass')
  })
})
