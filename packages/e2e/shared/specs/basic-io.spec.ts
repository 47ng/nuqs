import { expect, test as it } from '@playwright/test'
import { defineTest } from '../define-test'
import { navigateTo } from '../playwright/navigate'

export const testBasicIO = defineTest('Basic I/O', ({ path }) => {
  it('reads the value from the URL on mount', async ({ page }) => {
    await navigateTo(page, path, '?test=init')
    await expect(page.locator('#state')).toHaveText('init')
    await expect(page.locator('#null-detector')).toHaveText('pass')
  })

  it('writes the value to the URL', async ({ page }) => {
    await navigateTo(page, path)
    await expect(page.locator('#state')).toBeEmpty()
    await page.locator('button#set-pass').click()
    await expect(page.locator('#state')).toHaveText('pass')
    await expect(page).toHaveURL(url => url.search === '?test=pass')
  })

  it('updates the value in the URL', async ({ page }) => {
    await navigateTo(page, path, '?test=init')
    await expect(page.locator('#state')).toHaveText('init')
    await page.locator('button#set-pass').click()
    await expect(page.locator('#state')).toHaveText('pass')
    await expect(page).toHaveURL(url => url.search === '?test=pass')
    await expect(page.locator('#null-detector')).toHaveText('pass')
  })

  it('removes the value from the URL', async ({ page }) => {
    await navigateTo(page, path, '?test=init')
    await page.locator('button#clear').click()
    await expect(page.locator('#state')).toBeEmpty()
    await expect(page).toHaveURL(url => url.search === '')
  })

  it('removes a set value from the URL', async ({ page }) => {
    await navigateTo(page, path)
    await page.locator('button#set-pass').click()
    await page.locator('button#clear').click()
    await expect(page.locator('#state')).toBeEmpty()
    await expect(page).toHaveURL(url => url.search === '')
  })
})
