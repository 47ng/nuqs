import { expect, test as it } from '@playwright/test'
import { defineTest } from '../define-test'
import { navigateTo } from '../playwright/navigate'

export const testForm = defineTest('Form', ({ path }) => {
  it('supports native HTML forms to update search params', async ({
    page
  }) => {
    await navigateTo(page, path)
    await page.locator('input').fill('pass')
    await page.locator('input').press('Enter')
    await expect(page.locator('#state')).toHaveText('pass')
    await page.goBack()
    await expect(page.locator('#state')).toHaveText('')
  })

  it('supports loading initial form state from the URL', async ({ page }) => {
    await navigateTo(page, path, '?test=init')
    await expect(page.locator('input')).toHaveValue('init')
    await expect(page.locator('#state')).toHaveText('init')
    await page.locator('input').fill('pass')
    await page.locator('input').press('Enter')
    await expect(page.locator('#state')).toHaveText('pass')
    await page.goBack()
    await expect(page.locator('#state')).toHaveText('init')
  })
})
