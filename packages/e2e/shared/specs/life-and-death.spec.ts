import { expect, test as it, type Page } from '@playwright/test'
import { defineTest } from '../define-test'
import { navigateTo } from '../playwright/navigate'

/**
 * This tests that components mounting from a URL state update that also consume
 * that state do mount with the correct (optimistic) one from the get-go.
 * It also tests that they can clear it (self-destruct) and that they don't
 * throw errors when doing so.
 * See https://github.com/47ng/nuqs/issues/702
 */

export const testLifeAndDeath = defineTest('Life & Death', ({ path }) => {
  it('set from URL initial state, clear from useQueryState', async ({
    page
  }) => {
    await navigateTo(page, path, '?test=pass')
    await assertFilledState(page)
    await page.locator('#clear-useQueryState').click()
    await assertEmptyState(page)
  })

  it('set from URL initial state, clear from useQueryStates', async ({
    page
  }) => {
    await navigateTo(page, path, '?test=pass')
    await assertFilledState(page)
    await page.locator('#clear-useQueryStates').click()
    await assertEmptyState(page)
  })

  it('set from useQueryState, clear from useQueryState', async ({ page }) => {
    await navigateTo(page, path)
    await page.locator('#set-useQueryState').click()
    await assertFilledState(page)
    await page.locator('#clear-useQueryState').click()
    await assertEmptyState(page)
  })

  it('set from useQueryState, clear from useQueryStates', async ({ page }) => {
    await navigateTo(page, path)
    await page.locator('#set-useQueryState').click()
    await assertFilledState(page)
    await page.locator('#clear-useQueryStates').click()
    await assertEmptyState(page)
  })

  it('set from useQueryStates, clear from useQueryState', async ({ page }) => {
    await navigateTo(page, path)
    await page.locator('#set-useQueryStates').click()
    await assertFilledState(page)
    await page.locator('#clear-useQueryState').click()
    await assertEmptyState(page)
  })

  it('set from useQueryStates, clear from useQueryStates', async ({ page }) => {
    await navigateTo(page, path)
    await page.locator('#set-useQueryStates').click()
    await assertFilledState(page)
    await page.locator('#clear-useQueryStates').click()
    await assertEmptyState(page)
  })
})

async function assertFilledState(page: Page) {
  await expect(page.locator('#client-useQueryState')).toHaveText('pass')
  await expect(page.locator('#client-useQueryStates')).toHaveText('pass')
  await expect(page.locator('#null-detector-useQueryState')).toHaveText('pass')
  await expect(page.locator('#null-detector-useQueryStates')).toHaveText('pass')
}

async function assertEmptyState(page: Page) {
  await expect(page.locator('button')).toHaveCount(2)
  await expect(page.locator('#client-useQueryState')).toHaveCount(0)
  await expect(page.locator('#client-useQueryStates')).toHaveCount(0)
  await expect(page.locator('#null-detector-useQueryState')).toHaveCount(0)
  await expect(page.locator('#null-detector-useQueryStates')).toHaveCount(0)
}
