import { expect, test } from '@playwright/test'

test.describe('Repro for issue #839 - Location state persistence (HashRouter)', () => {
  test('persists location.state on shallow URL updates', async ({ page }) => {
    await page.goto('./#/repro-839')
    await page.waitForLoadState('networkidle')
    await page.locator('#hydration-marker').waitFor({ state: 'hidden' })
    await page.locator('#setup').click()
    await page.locator('#shallow').click()
    await expect(page.locator('#state')).toHaveText('{"test":"pass"}')
  })

  test('persists location.state on deep URL updates', async ({ page }) => {
    await page.goto('./#/repro-839')
    await page.waitForLoadState('networkidle')
    await page.locator('#hydration-marker').waitFor({ state: 'hidden' })
    await page.locator('#setup').click()
    await page.locator('#deep').click()
    await expect(page.locator('#state')).toHaveText('{"test":"pass"}')
  })
})
