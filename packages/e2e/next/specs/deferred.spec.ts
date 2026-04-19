import { expect, test } from '@playwright/test'
import { navigateTo } from 'e2e-shared/playwright/navigate.ts'

test('Deferred updates', async ({ page }) => {
  await navigateTo(page, '/app/deferred', '?a=init+a&b=init+b')
  await expect(page.locator('#input-a')).toHaveValue('init a')
  await expect(page.locator('#input-b')).toHaveValue('init b')
  await expect(page.locator('#state-a')).toHaveText('init a')
  await expect(page.locator('#state-b')).toHaveText('init b')

  await page.locator('#input-a').clear()
  await page.locator('#input-a').fill('a')
  await page.locator('#input-b').clear()
  await page.locator('#input-b').fill('b')

  await expect(page.locator('#input-a')).toHaveValue('a')
  await expect(page.locator('#input-b')).toHaveValue('b')
  await expect(page.locator('#state-a')).toHaveText('a')
  await expect(page.locator('#state-b')).toHaveText('b')
  await expect(page).toHaveURL(url => url.search === '?a=init+a&b=init+b')

  await page.locator('button').click()
  await expect(page).toHaveURL(url => url.search === '?a=a&b=b')
  await expect(page.locator('#input-a')).toHaveValue('a')
  await expect(page.locator('#input-b')).toHaveValue('b')
  await expect(page.locator('#state-a')).toHaveText('a')
  await expect(page.locator('#state-b')).toHaveText('b')
})
