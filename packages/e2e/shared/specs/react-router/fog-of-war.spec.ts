import { expect, test as it } from '@playwright/test'
import { defineTest } from '../../define-test'
import { navigateTo } from '../../playwright/navigate'

export const testFogOfWar = defineTest('Fog of War', ({ path }) => {
  it('should navigate to the result page', async ({ page }) => {
    await navigateTo(page, path)
    await page.locator('#set').click()
    await page.locator('#navigate').click()
    await expect(page).toHaveURL(url => url.pathname.endsWith(`${path}/result`))
    await expect(page.locator('#result')).toHaveText('pass')
  })
})
