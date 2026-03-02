import { expect, test } from '@playwright/test'
import { navigateTo } from 'e2e-shared/playwright/navigate.ts'

test('useQueryStates clear all', async ({ page }) => {
  await navigateTo(page, '/app/useQueryStates-clear-all', '?a=foo&b=bar')
  await page.locator('button').click()
  await expect(page).toHaveURL(url => url.search === '')
})
