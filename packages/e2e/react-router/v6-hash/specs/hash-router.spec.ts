import { expect, test } from '@playwright/test'

/**
 * HashRouter-specific URL structure tests.
 *
 * These tests verify the unique URL handling behavior of HashRouter,
 * where both pathname and search params are stored in the hash fragment.
 * Basic I/O tests are covered by the shared tests in shared.spec.ts.
 */
test.describe('HashRouter URL Structure', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('./#/basic-io/useQueryState')
    await page.waitForLoadState('networkidle')
    await page.locator('#hydration-marker').waitFor({ state: 'hidden' })
  })

  test('preserves the hash pathname when updating search params', async ({
    page
  }) => {
    await page.locator('button#set-pass').click()
    await expect(page).toHaveURL(url => {
      // Should preserve pathname in hash and add search params
      return (
        url.hash.startsWith('#/basic-io/useQueryState') &&
        url.hash.includes('?test=pass')
      )
    })
  })

  test('keeps search params in the hash fragment, not in url.search', async ({
    page
  }) => {
    await page.locator('button#set-pass').click()
    await expect(page).toHaveURL(url => {
      // url.search should be empty (params are in hash)
      return url.search === '' && url.hash.includes('?test=pass')
    })
  })
})
