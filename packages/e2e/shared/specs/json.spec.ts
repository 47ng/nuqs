import { expect, test as it } from '@playwright/test'
import { defineTest } from '../define-test'
import { createSearchMatcher } from '../playwright/expect-url'
import { navigateTo } from '../playwright/navigate'

export const testJson = defineTest('parseAsJson', ({ path, isHashRouter }) => {
  it('reads JSON from the URL', async ({ page }) => {
    await navigateTo(page, path, '?test={"name":"pass","age":123}', {
      isHashRouter
    })
    await expect(page.locator('#name-input')).toHaveValue('pass')
    await expect(page.locator('#client-name')).toHaveText('pass')
    await expect(page.locator('#client-age')).toHaveText('123')
  })

  it('writes JSON to the URL', async ({ page }) => {
    await navigateTo(page, path, '', { isHashRouter })
    await expect(page.locator('#name-input')).toHaveValue('init')
    await expect(page.locator('#client-name')).toHaveText('init')
    await expect(page.locator('#client-age')).toHaveText('42')
    await page.locator('button').click()
    await expect(page).toHaveURL(
      createSearchMatcher(
        '?test={%22name%22:%22pass%22,%22age%22:43}',
        isHashRouter ?? false
      )
    )
    await expect(page.locator('#name-input')).toHaveValue('pass')
    await expect(page.locator('#client-name')).toHaveText('pass')
    await expect(page.locator('#client-age')).toHaveText('43')
  })
})
