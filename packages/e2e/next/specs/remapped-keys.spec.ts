import { expect, test } from '@playwright/test'
import { navigateTo } from 'e2e-shared/playwright/navigate.ts'

test('Remapped keys', async ({ page }) => {
  await navigateTo(page, '/app/remapped-keys')
  await page.locator('#search').fill('a')
  await page.locator('#page').clear()
  await page.locator('#page').fill('42')
  await page.locator('#react').check()
  await page.locator('#nextjs').check()
  await expect(page).toHaveURL(url => url.search === '?q=a&page=42&tags=react,next.js')
})
