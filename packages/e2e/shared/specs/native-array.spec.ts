import { expect, test as it } from '@playwright/test'
import { defineTest } from '../define-test'
import { createSearchMatcher } from '../playwright/expect-url'
import { navigateTo } from '../playwright/navigate'

export const testNativeArray = defineTest(
  'parseAsNativeArray',
  ({ path, isHashRouter }) => {
    it('reads native array from the URL', async ({ page }) => {
      await navigateTo(page, path, '?test=1&test=2&test=3', { isHashRouter })
      await expect(page.locator('#client-name')).toHaveText('1 - 2 - 3')
      await page.locator('#add-button').click()
      await expect(page.locator('#client-name')).toHaveText('1 - 2 - 3 - 4')
    })

    it('works with the browser back button', async ({ page }) => {
      await navigateTo(page, path, '', { isHashRouter })
      await expect(page.locator('#client-name')).toBeEmpty()
      // Note: adding assertions after each action to ensure proper sequencing
      // (otherwise Playwright pools all actions into one URL update)
      await page.locator('#add-button').click()
      await expect(page.locator('#client-name')).toHaveText('1')
      await expect(page).toHaveURL(
        createSearchMatcher('?test=1', isHashRouter ?? false)
      )
      await page.locator('#add-button').click()
      await expect(page.locator('#client-name')).toHaveText('1 - 2')
      await expect(page).toHaveURL(
        createSearchMatcher('?test=1&test=2', isHashRouter ?? false)
      )
      await page.locator('#add-button').click()
      await expect(page.locator('#client-name')).toHaveText('1 - 2 - 3')
      await expect(page).toHaveURL(
        createSearchMatcher('?test=1&test=2&test=3', isHashRouter ?? false)
      )
      await page.goBack()
      await expect(page).toHaveURL(
        createSearchMatcher('?test=1&test=2', isHashRouter ?? false)
      )
      await expect(page.locator('#client-name')).toHaveText('1 - 2')
      await page.goForward()
      await expect(page).toHaveURL(
        createSearchMatcher('?test=1&test=2&test=3', isHashRouter ?? false)
      )
      await expect(page.locator('#client-name')).toHaveText('1 - 2 - 3')
    })
  }
)
