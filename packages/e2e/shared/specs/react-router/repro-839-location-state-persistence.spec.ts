import { expect, test as it } from '@playwright/test'
import { defineTest } from '../../define-test'
import { navigateTo } from '../../playwright/navigate'

export const testRepro839LocationStatePersistence = defineTest(
  'Repro for issue #839 - Location state persistence',
  ({ path }) => {
    it('persists location.state on shallow URL updates', async ({ page }) => {
      await navigateTo(page, path)
      await page.locator('#setup').click()
      await page.locator('#shallow').click()
      await expect(page.locator('#state')).toHaveText('{"test":"pass"}')
    })

    it('persists location.state on deep URL updates', async ({ page }) => {
      await navigateTo(page, path)
      await page.locator('#setup').click()
      await page.locator('#deep').click()
      await expect(page.locator('#state')).toHaveText('{"test":"pass"}')
    })
  }
)
