import { expect, test as it } from '@playwright/test'
import { defineTest } from '../define-test'
import { navigateTo } from '../playwright/navigate'

export const testPrettyUrls = defineTest('Pretty URLs', ({ path }) => {
  it('should render unencoded characters', async ({ page }) => {
    await navigateTo(page, path)
    await page.locator('button').click()
    await expect(page.locator('#state')).toHaveText('-._~!$()*,;=:@/?[]{}\\|^')
  })
})
