import { expect, test } from '@playwright/test'
import { navigateTo } from 'e2e-shared/playwright/navigate.ts'

test('does not append a trailing slash', async ({ page }) => {
  await navigateTo(page, '/trailing-slash')
  await expect(page).toHaveURL(url => url.pathname === '/trailing-slash')
  await page.getByText('Set declared').click()
  await expect(page).toHaveURL(url => url.pathname === '/trailing-slash')
  await page.getByText('Clear').click()
  await expect(page).toHaveURL(url => url.pathname === '/trailing-slash')
  await page.getByText('Set undeclared').click()
  await expect(page).toHaveURL(url => url.pathname === '/trailing-slash')
  await page.getByText('Clear').click()
  await expect(page).toHaveURL(url => url.pathname === '/trailing-slash')
})
