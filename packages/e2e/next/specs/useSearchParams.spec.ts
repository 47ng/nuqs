import { expect, test } from '@playwright/test'
import { navigateTo } from 'e2e-shared/playwright/navigate.ts'

test('useSearchParams', async ({ page }) => {
  await navigateTo(page, '/app/useSearchParams')
  await page.locator('input').fill('foo')
  await expect(page.locator('#searchParams')).toHaveText('q=foo')
  await page.locator('button').click()
  await expect(page.locator('#searchParams')).toHaveText('q=foo&push=true')
})
