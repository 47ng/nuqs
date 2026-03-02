import { expect, test } from '@playwright/test'
import { navigateTo } from 'e2e-shared/playwright/navigate.ts'

test('Referential equality', async ({ page }) => {
  await navigateTo(page, '/app/referential-equality')
  await expect(page.locator('#ref-a')).toHaveText('1')
  await expect(page.locator('#ref-b')).toHaveText('1')

  await page.locator('#increment-a').click()
  await expect(page.locator('#ref-a')).toHaveText('2')
  await expect(page.locator('#ref-b')).toHaveText('1')

  await page.locator('#increment-b').click()
  await expect(page.locator('#ref-a')).toHaveText('2')
  await expect(page.locator('#ref-b')).toHaveText('2')

  await page.locator('#idempotent-a').click()
  await expect(page.locator('#ref-a')).toHaveText('2')
  await expect(page.locator('#ref-b')).toHaveText('2')

  await page.locator('#idempotent-b').click()
  await expect(page.locator('#ref-a')).toHaveText('2')
  await expect(page.locator('#ref-b')).toHaveText('2')

  await page.locator('#clear-a').click()
  await expect(page.locator('#ref-a')).toHaveText('3')
  await expect(page.locator('#ref-b')).toHaveText('2')

  await page.locator('#clear-b').click()
  await expect(page.locator('#ref-a')).toHaveText('3')
  await expect(page.locator('#ref-b')).toHaveText('3')

  await page.locator('#link').click()
  await expect(page.locator('#ref-a')).toHaveText('3')
  await expect(page.locator('#ref-b')).toHaveText('3')
})
