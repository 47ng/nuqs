import { expect, test as it } from '@playwright/test'
import { defineTest } from '../define-test'
import { navigateTo } from '../playwright/navigate'

export const testScroll = defineTest('scroll', ({ path }) => {
  it('does not scroll to the top of the page by default (scroll: false)', async ({
    page
  }) => {
    await navigateTo(page, path, '?scroll=false')
    await expect(page.locator('#not-at-the-top')).toBeVisible()
    await page.locator('button').click()
    await expect(page.locator('#not-at-the-top')).toBeVisible()
  })

  it('scrolls to the top of the page when setting scroll: true', async ({
    page
  }) => {
    await navigateTo(page, path, '?scroll=true')
    await expect(page.locator('#not-at-the-top')).toBeVisible()
    await page.locator('button').click()
    await expect(page.locator('#at-the-top')).toBeVisible()
  })
})
