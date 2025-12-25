import { expect, test as it } from '@playwright/test'
import { defineTest } from '../define-test'
import { navigateTo } from '../playwright/navigate'

export const testHashPreservation = defineTest(
  'Hash Preservation',
  ({ path }) => {
    it('preserves the hash on state updates', async ({ page }) => {
      await navigateTo(page, path, '#hash')
      await page.locator('#set').click()
      await expect(page).toHaveURL(url => url.hash === '#hash')
      await page.locator('#clear').click()
      await expect(page).toHaveURL(url => url.hash === '#hash')
    })
  }
)
