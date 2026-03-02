import { expect, test as it } from '@playwright/test'
import { defineTest } from '../define-test'
import { navigateTo } from '../playwright/navigate'

export const testPush = defineTest('Push', ({ path }) => {
  it('pushes a new state to the history and allows navigating states with Back/Forward', async ({
    page
  }) => {
    await navigateTo(page, path, '?test=init')
    await page.locator('button').click()
    await expect(page).toHaveURL(url => url.search === '?test=pass')
    await expect(page.locator('#state')).toHaveText('pass')
    await page.goBack()
    await expect(page.locator('#state')).toHaveText('init')
    await expect(page).toHaveURL(url => url.search === '?test=init')
    await page.goForward()
    await expect(page).toHaveURL(url => url.search === '?test=pass')
    await expect(page.locator('#state')).toHaveText('pass')
  })
})
