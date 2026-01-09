import { expect, test as it } from '@playwright/test'
import { defineTest } from '../define-test'
import { navigateTo } from '../playwright/navigate'

export const testPrettyUrls = defineTest(
  'Pretty URLs',
  ({ path, isHashRouter }) => {
    it('should render unencoded characters', async ({ page }) => {
      await navigateTo(page, path, '', { isHashRouter })
      await page.locator('button').click()
      await expect(page.locator('#state')).toHaveText('-._~!$()*,;=:@/?[]{}\\|^')
    })
  }
)
