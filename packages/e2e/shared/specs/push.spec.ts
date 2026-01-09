import { expect, test as it } from '@playwright/test'
import { defineTest } from '../define-test'
import { createSearchMatcher } from '../playwright/expect-url'
import { navigateTo } from '../playwright/navigate'

export const testPush = defineTest('Push', ({ path, isHashRouter }) => {
  it('pushes a new state to the history and allows navigating states with Back/Forward', async ({
    page
  }) => {
    await navigateTo(page, path, '?test=init', { isHashRouter })
    await page.locator('button').click()
    await expect(page).toHaveURL(
      createSearchMatcher('?test=pass', isHashRouter ?? false)
    )
    await expect(page.locator('#state')).toHaveText('pass')
    await page.goBack()
    await expect(page.locator('#state')).toHaveText('init')
    await expect(page).toHaveURL(
      createSearchMatcher('?test=init', isHashRouter ?? false)
    )
    await page.goForward()
    await expect(page).toHaveURL(
      createSearchMatcher('?test=pass', isHashRouter ?? false)
    )
    await expect(page.locator('#state')).toHaveText('pass')
  })
})
