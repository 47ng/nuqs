import { expect, test as it } from '@playwright/test'
import { defineTest } from '../define-test'
import { navigateTo } from '../playwright/navigate'

export const testLinking = defineTest('Linking', ({ path }) => {
  it('picks up state from Links pointing to the same page', async ({
    page
  }) => {
    await navigateTo(page, path)
    await expect(page.locator('#state')).toBeEmpty()
    await page.locator('a').click()
    await expect(page.locator('#state')).toHaveText('pass')
  })

  it('picks up state from Links from another page', async ({ page }) => {
    await navigateTo(page, path + '/other')
    await expect(page.locator('#state')).toBeEmpty()
    await page.locator('a').click()
    await expect(page.locator('#state').first()).toHaveText('pass')
  })
})
