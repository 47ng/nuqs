import { expect, test } from '@playwright/test'

/**
 * Helper to extract search params from hash-based URL.
 * e.g., "http://localhost:3016/#/page?foo=bar" => "?foo=bar"
 */
function getSearchFromHash(url: URL): string {
  const hash = url.hash
  const hashContent = hash.startsWith('#') ? hash.slice(1) : hash
  const searchIndex = hashContent.indexOf('?')
  return searchIndex >= 0 ? hashContent.slice(searchIndex) : ''
}

test.describe('HashRouter Basic I/O', () => {
  test('reads the value from the URL on mount', async ({ page }) => {
    await page.goto('./#/basic-io/useQueryState?test=init')
    await page.waitForLoadState('networkidle')
    await page.locator('#hydration-marker').waitFor({ state: 'hidden' })
    await expect(page.locator('#state')).toHaveText('init')
  })

  test('writes the value to the URL', async ({ page }) => {
    await page.goto('./#/basic-io/useQueryState')
    await page.waitForLoadState('networkidle')
    await page.locator('#hydration-marker').waitFor({ state: 'hidden' })
    await expect(page.locator('#state')).toBeEmpty()
    await page.locator('button#set-pass').click()
    await expect(page.locator('#state')).toHaveText('pass')
    await expect(page).toHaveURL(url => getSearchFromHash(url) === '?test=pass')
  })

  test('updates the value in the URL', async ({ page }) => {
    await page.goto('./#/basic-io/useQueryState?test=init')
    await page.waitForLoadState('networkidle')
    await page.locator('#hydration-marker').waitFor({ state: 'hidden' })
    await expect(page.locator('#state')).toHaveText('init')
    await page.locator('button#set-pass').click()
    await expect(page.locator('#state')).toHaveText('pass')
    await expect(page).toHaveURL(url => getSearchFromHash(url) === '?test=pass')
  })

  test('removes the value from the URL', async ({ page }) => {
    await page.goto('./#/basic-io/useQueryState?test=init')
    await page.waitForLoadState('networkidle')
    await page.locator('#hydration-marker').waitFor({ state: 'hidden' })
    await page.locator('button#clear').click()
    await expect(page.locator('#state')).toBeEmpty()
    await expect(page).toHaveURL(url => getSearchFromHash(url) === '')
  })
})

test.describe('HashRouter useQueryStates', () => {
  test('reads the value from the URL on mount', async ({ page }) => {
    await page.goto('./#/basic-io/useQueryStates?test=init')
    await page.waitForLoadState('networkidle')
    await page.locator('#hydration-marker').waitFor({ state: 'hidden' })
    await expect(page.locator('#state')).toHaveText('init')
  })

  test('writes the value to the URL', async ({ page }) => {
    await page.goto('./#/basic-io/useQueryStates')
    await page.waitForLoadState('networkidle')
    await page.locator('#hydration-marker').waitFor({ state: 'hidden' })
    await expect(page.locator('#state')).toBeEmpty()
    await page.locator('button#set-pass').click()
    await expect(page.locator('#state')).toHaveText('pass')
    await expect(page).toHaveURL(url => getSearchFromHash(url) === '?test=pass')
  })
})

test.describe('HashRouter URL Structure', () => {
  test('preserves the hash pathname when updating search params', async ({
    page
  }) => {
    await page.goto('./#/basic-io/useQueryState')
    await page.waitForLoadState('networkidle')
    await page.locator('#hydration-marker').waitFor({ state: 'hidden' })
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
    await page.goto('./#/basic-io/useQueryState')
    await page.waitForLoadState('networkidle')
    await page.locator('#hydration-marker').waitFor({ state: 'hidden' })
    await page.locator('button#set-pass').click()
    await expect(page).toHaveURL(url => {
      // url.search should be empty (params are in hash)
      return url.search === '' && url.hash.includes('?test=pass')
    })
  })
})

test.describe('HashRouter Navigation', () => {
  test('back button restores previous state', async ({ page }) => {
    await page.goto('./#/push/useQueryState')
    await page.waitForLoadState('networkidle')
    await page.locator('#hydration-marker').waitFor({ state: 'hidden' })
    // The push page has a button with text "Test" that sets state to "pass"
    await page.locator('button').click()
    await expect(page.locator('#state')).toHaveText('pass')
    await expect(page).toHaveURL(url => getSearchFromHash(url) === '?test=pass')
    await page.goBack()
    await expect(page).toHaveURL(url => getSearchFromHash(url) === '')
    await expect(page.locator('#state')).toBeEmpty()
  })
})
