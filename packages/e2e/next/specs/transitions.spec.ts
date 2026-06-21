import { expect, test } from '@playwright/test'
import { navigateTo } from 'e2e-shared/playwright/navigate.ts'

test('transitions', async ({ page }) => {
  await navigateTo(page, '/app/transitions')
  await expect(page.locator('#server-rendered')).toHaveText('{}')
  await expect(page.locator('#server-status')).toHaveText('idle')

  const button = page.locator('button')
  await expect(button).toHaveText('0')
  await button.click()
  await expect(button).toHaveText('1') // Instant setState
  await expect(page.locator('#server-rendered')).toHaveText('{}')
  await expect(page.locator('#server-status')).toHaveText('loading')

  await page.waitForTimeout(500)
  await expect(page.locator('#server-rendered')).toHaveText('{}')
  await expect(page.locator('#server-status')).toHaveText('loading')

  await page.waitForTimeout(500)
  await expect(page.locator('#server-rendered')).toHaveText('{"counter":"1"}')
  await expect(page.locator('#server-status')).toHaveText('idle')
})
