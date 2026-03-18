import { expect, test as it } from '@playwright/test'
import { defineTest } from '../define-test'
import { navigateTo } from '../playwright/navigate'

export const testHistorySync = defineTest('History Sync', ({ path }) => {
  it('history.replaceState synchronously updates location.search', async ({
    page
  }) => {
    await navigateTo(page, path)
    await page.getByRole('button', { name: 'Test replaceState' }).click()
    await expect(page.locator('#client-state')).toHaveText('?test=pass')
  })

  it('history.pushState synchronously updates location.search', async ({
    page
  }) => {
    await navigateTo(page, path)
    await page.getByRole('button', { name: 'Test pushState' }).click()
    await expect(page.locator('#client-state')).toHaveText('?test=pass')
  })
})
