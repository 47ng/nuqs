import { expect, test, type Page } from '@playwright/test'
import { navigateTo } from 'e2e-shared/playwright/navigate.ts'

async function runPushTest(page: Page) {
  await expect(page.locator('#server-side')).toHaveText('0')
  await expect(page.locator('#server')).toHaveText('0')
  await expect(page.locator('#client')).toHaveText('0')

  await page.locator('button#server-incr').click()
  await expect(page).toHaveURL(url => url.search === '?server=1')
  await expect(page.locator('#server-side')).toHaveText('1')
  await expect(page.locator('#server')).toHaveText('1')
  await expect(page.locator('#client')).toHaveText('0')

  await page.locator('button#client-incr').click()
  await expect(page).toHaveURL(url => url.search === '?server=1&client=1')
  await expect(page.locator('#server-side')).toHaveText('1')
  await expect(page.locator('#server')).toHaveText('1')
  await expect(page.locator('#client')).toHaveText('1')

  await page.goBack()
  await expect(page).toHaveURL(url => url.search === '?server=1')
  await expect(page.locator('#server-side')).toHaveText('1')
  await expect(page.locator('#server')).toHaveText('1')
  await expect(page.locator('#client')).toHaveText('0')

  await page.goBack()
  await expect(page).toHaveURL(url => url.search === '')
  await expect(page.locator('#server-side')).toHaveText('0')
  await expect(page.locator('#server')).toHaveText('0')
  await expect(page.locator('#client')).toHaveText('0')

  await page.goForward()
  await expect(page).toHaveURL(url => url.search === '?server=1')
  await expect(page.locator('#server-side')).toHaveText('1')
  await expect(page.locator('#server')).toHaveText('1')
  await expect(page.locator('#client')).toHaveText('0')

  await page.goForward()
  await expect(page).toHaveURL(url => url.search === '?server=1&client=1')
  await expect(page.locator('#server-side')).toHaveText('1')
  await expect(page.locator('#server')).toHaveText('1')
  await expect(page.locator('#client')).toHaveText('1')
}

test.describe('push', () => {
  test('works in app router', async ({ page }) => {
    await navigateTo(page, '/app/push')
    await runPushTest(page)
  })

  test('works in pages router', async ({ page }) => {
    await navigateTo(page, '/pages/push')
    await runPushTest(page)
  })
})
