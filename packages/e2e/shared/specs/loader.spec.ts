import { expect, test as it } from '@playwright/test'
import { defineTest } from '../define-test'
import { navigateTo } from '../playwright/navigate'

export const testLoader = defineTest('Loader', ({ path }) => {
  it('loads state from the URL', async ({ page }) => {
    await navigateTo(page, path + '?test=pass&int=42')
    await expect(page.locator('#test')).toHaveText('pass')
    await expect(page.locator('#int')).toHaveText('42')
  })
})
