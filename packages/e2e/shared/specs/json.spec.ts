import { expect, test as it } from '@playwright/test'
import { defineTest } from '../define-test'
import { navigateTo } from '../playwright/navigate'

export const testJson = defineTest('parseAsJson', ({ path }) => {
  it('reads JSON from the URL', async ({ page }) => {
    await navigateTo(page, path, '?test={"name":"pass","age":123}')
    await expect(page.locator('#name-input')).toHaveValue('pass')
    await expect(page.locator('#client-name')).toHaveText('pass')
    await expect(page.locator('#client-age')).toHaveText('123')
  })

  it('writes JSON to the URL', async ({ page }) => {
    await navigateTo(page, path)
    await expect(page.locator('#name-input')).toHaveValue('init')
    await expect(page.locator('#client-name')).toHaveText('init')
    await expect(page.locator('#client-age')).toHaveText('42')
    await page.locator('button').click()
    await expect(page).toHaveURL(
      url => url.search === '?test={%22name%22:%22pass%22,%22age%22:43}'
    )
    await expect(page.locator('#name-input')).toHaveValue('pass')
    await expect(page.locator('#client-name')).toHaveText('pass')
    await expect(page.locator('#client-age')).toHaveText('43')
  })
})
