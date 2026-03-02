import { expect, test } from '@playwright/test'
import { navigateTo } from 'e2e-shared/playwright/navigate.ts'

test.describe('cache', () => {
  test('works in app router', async ({ page }) => {
    await navigateTo(
      page,
      '/app/cache',
      '?str=foo&num=42&idx=1&bool=true&multi=foo&multi=bar'
    )
    await expect(page.locator('#parse-str')).toHaveText('foo')
    await expect(page.locator('#parse-num')).toHaveText('42')
    await expect(page.locator('#parse-idx')).toHaveText('0')
    await expect(page.locator('#parse-bool')).toHaveText('true')
    await expect(page.locator('#parse-def')).toHaveText('default')
    await expect(page.locator('#parse-nope')).toHaveText('null')
    await expect(page.locator('#all-str')).toHaveText('foo')
    await expect(page.locator('#all-num')).toHaveText('42')
    await expect(page.locator('#all-idx')).toHaveText('0')
    await expect(page.locator('#all-bool')).toHaveText('true')
    await expect(page.locator('#all-def')).toHaveText('default')
    await expect(page.locator('#all-nope')).toHaveText('null')
    await expect(page.locator('#get-str')).toHaveText('foo')
    await expect(page.locator('#get-num')).toHaveText('42')
    await expect(page.locator('#get-idx')).toHaveText('0')
    await expect(page.locator('#get-bool')).toHaveText('true')
    await expect(page.locator('#get-def')).toHaveText('default')
    await expect(page.locator('#get-nope')).toHaveText('null')
    await expect(page).toHaveTitle('metadata-title-str:foo')
  })
})
