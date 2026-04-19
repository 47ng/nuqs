import { expect, test as it } from '@playwright/test'
import { defineTest } from '../define-test'
import { navigateTo } from '../playwright/navigate'

export const testConditionalRendering = defineTest(
  'Conditional rendering',
  ({ path }) => {
    it('should have the correct initial state after mounting', async ({
      page
    }) => {
      await navigateTo(page, path, '?test=pass')
      await page.locator('button#mount').click()
      await expect(page.locator('#state')).toHaveText('pass')
      await expect(page.locator('#null-detector')).toHaveText('pass')
    })

    it('should keep the correct state after unmounting and remounting', async ({
      page
    }) => {
      await navigateTo(page, path)
      await page.locator('button#mount').click()
      await page.locator('button#set').click()
      await page.locator('button#unmount').click()
      await page.locator('button#mount').click()
      await expect(page.locator('#state')).toHaveText('pass')
      await expect(page.locator('#null-detector')).toHaveText('pass')
    })

    it('should keep the correct state after unmounting and remounting with a different state', async ({
      page
    }) => {
      await navigateTo(page, path, '?test=init')
      await page.locator('button#mount').click()
      await page.locator('button#set').click()
      await page.locator('button#unmount').click()
      await page.locator('button#mount').click()
      await expect(page.locator('#state')).toHaveText('pass')
      await expect(page.locator('#null-detector')).toHaveText('pass')
    })
  }
)
